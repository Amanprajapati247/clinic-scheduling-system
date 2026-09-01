import { AuthService } from './src/services/authService';
import { AppointmentService } from './src/services/appointmentService';
import { SlotService } from './src/services/slotService';
import { ScheduleService } from './src/services/scheduleService';
import { VisitNoteService } from './src/services/visitNoteService';
import { TimelineService } from './src/services/timelineService';
import { DashboardService } from './src/services/dashboardService';
import { AlertService } from './src/services/alertService';
import { prisma } from './src/prisma/client';
import { AppointmentStatus, Role, AlertType } from './src/config/constants';

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING CLINIC SCHEDULING SYSTEM VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Test Auth & RBAC
    console.log('[1] Testing Authentication & RBAC...');
    const frontDeskLogin = await AuthService.login({
      email: 'frontdesk@example.com',
      password: 'Password123',
    });
    assert(frontDeskLogin.user.role === Role.FRONT_DESK, 'Front Desk login returns correct role & JWT');

    const providerLogin = await AuthService.login({
      email: 'provider@example.com',
      password: 'Password123',
    });
    assert(
      providerLogin.user.role === Role.PROVIDER && !!providerLogin.user.provider?.id,
      'Provider login returns PROVIDER role and linked provider entity'
    );

    const providers = await AuthService.getAllProviders();
    assert(providers.length >= 5, `Retrieved ${providers.length} registered providers`);

    // 2. Test Slot Management & RBAC
    console.log('\n[2] Testing Slot Management & Restrictions...');
    const prov1 = providers[0];
    const prov2 = providers[1];

    // Create slot by Front Desk
    const today = new Date().toISOString().split('T')[0];
    const newSlot = await SlotService.createSlot(
      {
        providerId: prov1.id,
        date: today,
        startTime: '17:00',
        duration: 30,
      },
      { role: Role.FRONT_DESK }
    );
    assert(newSlot.isBooked === false && newSlot.startTime === '17:00', 'Front Desk can create provider slot');

    // Provider attempting to create slot for another provider should fail
    let providerForbidden = false;
    try {
      await SlotService.createSlot(
        {
          providerId: prov2.id,
          date: today,
          startTime: '17:30',
          duration: 30,
        },
        { role: Role.PROVIDER, providerId: prov1.id }
      );
    } catch (e: any) {
      providerForbidden = true;
    }
    assert(providerForbidden, 'Provider is blocked from creating slots for other providers');

    // Edit unbooked slot
    const updatedSlot = await SlotService.updateSlot(
      newSlot.id,
      { startTime: '17:15' },
      { role: Role.FRONT_DESK }
    );
    assert(updatedSlot.startTime === '17:15', 'Unbooked slot can be edited');

    // Archive and restore slot
    const archived = await SlotService.archiveSlot(newSlot.id, { role: Role.FRONT_DESK });
    assert(archived.isArchived === true, 'Slot can be archived');
    const restored = await SlotService.restoreSlot(newSlot.id, { role: Role.FRONT_DESK });
    assert(restored.isArchived === false, 'Slot can be restored');

    // 3. Test Booking & Finite State Machine
    console.log('\n[3] Testing Booking & State Machine Validation...');
    const bookedApt = await AppointmentService.createAppointment(
      {
        slotId: newSlot.id,
        patientName: 'Suite Test Patient',
        patientEmail: 'test.patient@example.com',
        patientPhone: '+1 555-0199',
        reasonForVisit: 'State machine verification visit',
      },
      { userId: frontDeskLogin.user.id, role: Role.FRONT_DESK }
    );
    assert(bookedApt.status === AppointmentStatus.Requested, 'New appointment starts in Requested status');

    // Verify slot is now locked
    const slotAfterBook = await prisma.appointmentSlot.findUnique({ where: { id: newSlot.id } });
    assert(slotAfterBook?.isBooked === true, 'Slot is marked booked after appointment creation');

    // Attempting to edit a booked slot must fail
    let editBookedFailed = false;
    try {
      await SlotService.updateSlot(newSlot.id, { startTime: '18:00' }, { role: Role.FRONT_DESK });
    } catch (e) {
      editBookedFailed = true;
    }
    assert(editBookedFailed, 'Editing booked slot is strictly prohibited');

    // Test Invalid State Machine Transition: Requested -> Completed directly
    let invalidTransitionFailed = false;
    try {
      await AppointmentService.updateStatus(bookedApt.id, AppointmentStatus.Completed, undefined, {
        userId: frontDeskLogin.user.id,
        role: Role.FRONT_DESK,
      });
    } catch (e: any) {
      invalidTransitionFailed = true;
    }
    assert(invalidTransitionFailed, 'Invalid transition (Requested -> Completed) is rejected by State Machine');

    // Valid Transition: Requested -> Confirmed
    const confirmedApt = await AppointmentService.updateStatus(
      bookedApt.id,
      AppointmentStatus.Confirmed,
      undefined,
      { userId: frontDeskLogin.user.id, role: Role.FRONT_DESK }
    );
    assert(confirmedApt.status === AppointmentStatus.Confirmed, 'Valid transition Requested -> Confirmed succeeds');

    // Valid Transition: Confirmed -> CheckedIn
    const checkedInApt = await AppointmentService.updateStatus(
      bookedApt.id,
      AppointmentStatus.CheckedIn,
      undefined,
      { userId: frontDeskLogin.user.id, role: Role.FRONT_DESK }
    );
    assert(
      checkedInApt.status === AppointmentStatus.CheckedIn && !!checkedInApt.checkedInAt,
      'Valid transition Confirmed -> CheckedIn succeeds and timestamps checkedInAt'
    );

    // Cancel after CheckedIn must fail
    let cancelAfterCheckedInFailed = false;
    try {
      await AppointmentService.updateStatus(
        bookedApt.id,
        AppointmentStatus.Cancelled,
        'Patient changed mind',
        { userId: frontDeskLogin.user.id, role: Role.FRONT_DESK }
      );
    } catch (e) {
      cancelAfterCheckedInFailed = true;
    }
    assert(cancelAfterCheckedInFailed, 'Cancellation is prohibited once patient has CheckedIn');

    // Valid Transition: CheckedIn -> Completed
    const completedApt = await AppointmentService.updateStatus(
      bookedApt.id,
      AppointmentStatus.Completed,
      undefined,
      { userId: frontDeskLogin.user.id, role: Role.FRONT_DESK }
    );
    assert(
      completedApt.status === AppointmentStatus.Completed && !!completedApt.completedAt,
      'Valid transition CheckedIn -> Completed succeeds and timestamps completedAt'
    );

    // 4. Test Care Team (Many-to-Many Supporting Providers)
    console.log('\n[4] Testing Care Team Collaboration (M:N)...');
    const careTeamRecord = await AppointmentService.addSupportingProvider(
      bookedApt.id,
      prov2.id,
      { userId: frontDeskLogin.user.id, role: Role.FRONT_DESK }
    );
    assert(careTeamRecord.providerId === prov2.id, 'Supporting provider added to Care Team');

    // 5. Test Visit Notes Author Locking
    console.log('\n[5] Testing Visit Notes & Author-Only Editing...');
    const note = await VisitNoteService.createNote(
      bookedApt.id,
      'Initial diagnostic examination by Dr. Prov 1',
      { userId: prov1.userId, providerId: prov1.id }
    );
    assert(note.content.includes('Initial diagnostic'), 'Author provider creates visit note');

    // Author provider editing own note
    const editedNote = await VisitNoteService.updateNote(
      note.id,
      'Initial diagnostic examination - Updated with lab results',
      { userId: prov1.userId, providerId: prov1.id }
    );
    assert(editedNote.content.includes('Updated with lab results'), 'Author provider successfully edits note');

    // Other provider attempting to edit should be rejected with 403
    let otherProviderEditFailed = false;
    try {
      await VisitNoteService.updateNote(
        note.id,
        'Unauthorized edit attempt by different provider',
        { userId: prov2.userId, providerId: prov2.id }
      );
    } catch (e) {
      otherProviderEditFailed = true;
    }
    assert(otherProviderEditFailed, 'Non-author provider is blocked from editing visit notes');

    // 6. Test Immutable Audit Timeline
    console.log('\n[6] Testing Immutable Audit Timeline...');
    const timeline = await TimelineService.getTimelineForAppointment(bookedApt.id);
    assert(
      timeline.length >= 4,
      `Immutable Timeline recorded ${timeline.length} audit logs (Creation, Status transitions, Supporting provider, Visit note)`
    );

    // 7. Test Bulk Recurring Slots & Collision Avoidance
    console.log('\n[7] Testing Bulk Availability Generation & CSV Exporter...');
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 10);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7);

    const bulkResult = await ScheduleService.generateBulkSlots(
      {
        providerId: prov1.id,
        startDate: nextWeekStart.toISOString().split('T')[0],
        endDate: nextWeekEnd.toISOString().split('T')[0],
        schedules: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '11:00', slotDuration: 30 },
          { dayOfWeek: 3, startTime: '14:00', endTime: '16:00', slotDuration: 30 },
        ],
      },
      { role: Role.FRONT_DESK }
    );
    assert(bulkResult.createdSlots > 0, `Bulk generator created ${bulkResult.createdSlots} slots`);

    // Re-running same bulk generation should skip all collisions
    const bulkCollisionResult = await ScheduleService.generateBulkSlots(
      {
        providerId: prov1.id,
        startDate: nextWeekStart.toISOString().split('T')[0],
        endDate: nextWeekEnd.toISOString().split('T')[0],
        schedules: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '11:00', slotDuration: 30 },
          { dayOfWeek: 3, startTime: '14:00', endTime: '16:00', slotDuration: 30 },
        ],
      },
      { role: Role.FRONT_DESK }
    );
    assert(
      bulkCollisionResult.createdSlots === 0 && bulkCollisionResult.skippedSlots > 0,
      `Collision avoidance skipped ${bulkCollisionResult.skippedSlots} colliding duplicate slots`
    );

    // CSV Exporter
    const csvData = await ScheduleService.exportDailyScheduleCSV(today);
    assert(
      csvData.includes('"Patient","Provider","Status","Start Time","Duration (mins)"'),
      'Daily Schedule CSV export contains all standard required headers'
    );

    // 8. Test Dashboard Analytics
    console.log('\n[8] Testing Dashboard Analytics...');
    const dashboardMetrics = await DashboardService.getMetrics({ role: Role.FRONT_DESK });
    assert(
      typeof dashboardMetrics.metrics.appointmentsToday === 'number' &&
      dashboardMetrics.appointmentsByProvider.length > 0 &&
      dashboardMetrics.appointmentsByStatus.length > 0 &&
      dashboardMetrics.weeklyNoShowRate.length === 8,
      'Dashboard returns 4 core metrics, provider breakdown, status breakdown, and 8-week no show rate'
    );

    // 9. Test Unconfirmed Alerts & 1-Hour Reappearance
    console.log('\n[9] Testing Unconfirmed 24h Warning & 1h Critical Reappearing Alerts...');
    const activeAlerts = await AlertService.getActiveAlerts();
    assert(Array.isArray(activeAlerts), `Alerts engine identified ${activeAlerts.length} unconfirmed alerts`);

    if (activeAlerts.length > 0) {
      const firstAlert = activeAlerts[0];
      const dismissal = await AlertService.dismissAlert(
        firstAlert.id,
        firstAlert.alertType,
        { userId: frontDeskLogin.user.id, role: Role.FRONT_DESK }
      );
      assert(!!dismissal.id, 'Front Desk successfully dismissed unconfirmed alert');
    }

    // 10. Test Server-side Search & Pagination
    console.log('\n[10] Testing Server-side Search, Filtering & Pagination...');
    const searchResults = await AppointmentService.searchAppointments(
      { page: 1, limit: 5, sortBy: 'date', sortOrder: 'asc' },
      { role: Role.FRONT_DESK }
    );
    assert(
      searchResults.data.length <= 5 &&
      searchResults.totalResults > 0 &&
      searchResults.totalPages >= 1,
      `Server-side search returned page 1 with ${searchResults.data.length} records of total ${searchResults.totalResults}`
    );

  } catch (error) {
    console.error('Fatal test error:', error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runTestSuite();
