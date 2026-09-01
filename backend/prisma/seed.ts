import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const formatDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clean existing records in reverse dependency order
  await prisma.alertDismissal.deleteMany();
  await prisma.appointmentTimeline.deleteMany();
  await prisma.visitNote.deleteMany();
  await prisma.supportingProvider.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appointmentSlot.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing database records.');

  const defaultPassword = await bcrypt.hash('Password123', 10);

  // 1. Create Front Desk Users
  const frontDesk1 = await prisma.user.create({
    data: {
      email: 'frontdesk@example.com',
      passwordHash: defaultPassword,
      name: 'Alice Morgan (Front Desk Lead)',
      role: 'FRONT_DESK',
    },
  });

  const frontDesk2 = await prisma.user.create({
    data: {
      email: 'frontdesk2@example.com',
      passwordHash: defaultPassword,
      name: 'Bob Vance (Front Desk Coordinator)',
      role: 'FRONT_DESK',
    },
  });

  console.log('Created 2 Front Desk Users.');

  // 2. Create 5 Providers
  const providerData = [
    {
      email: 'provider@example.com',
      name: 'Dr. Gregory House',
      specialty: 'Diagnostic Medicine',
      department: 'Department of Internal Medicine',
      phone: '+1 (555) 019-2831',
    },
    {
      email: 'provider2@example.com',
      name: 'Dr. James Wilson',
      specialty: 'Medical Oncology',
      department: 'Department of Oncology',
      phone: '+1 (555) 019-2832',
    },
    {
      email: 'provider3@example.com',
      name: 'Dr. Lisa Cuddy',
      specialty: 'Endocrinology & Internal Medicine',
      department: 'Administration & Outpatient Care',
      phone: '+1 (555) 019-2833',
    },
    {
      email: 'provider4@example.com',
      name: 'Dr. Robert Chase',
      specialty: 'Intensive Care & Surgery',
      department: 'Critical Care Services',
      phone: '+1 (555) 019-2834',
    },
    {
      email: 'provider5@example.com',
      name: 'Dr. Allison Cameron',
      specialty: 'Immunology & Allergy',
      department: 'Immunology & Infectious Disease',
      phone: '+1 (555) 019-2835',
    },
  ];

  const providers: any[] = [];

  for (const p of providerData) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash: defaultPassword,
        name: p.name,
        role: 'PROVIDER',
        provider: {
          create: {
            specialty: p.specialty,
            department: p.department,
            phone: p.phone,
          },
        },
      },
      include: { provider: true },
    });
    providers.push(user.provider);
  }

  console.log('Created 5 Clinical Providers.');

  // Reference Date: Today
  const today = new Date();
  const todayStr = formatDate(today);

  // Generate Slots and 50 Appointments across past 6 weeks, today, and next 2 weeks
  const patientNames = [
    'Eleanor Vance', 'Arthur Pendelton', 'Clara Oswald', 'David Tennant', 'Sarah Jane Smith',
    'Martha Jones', 'Rose Tyler', 'Donna Noble', 'Rory Williams', 'Amy Pond',
    'Jack Harkness', 'River Song', 'Wilfred Mott', 'Harriet Jones', 'Mickey Smith',
    'Brigadier Lethbridge', 'Jo Grant', 'Sarah Manning', 'Felix Dawkins', 'Cosima Niehaus',
    'Alison Hendrix', 'Rachel Duncan', 'Helena Petrova', 'Delphine Cormier', 'Paul Dierden',
    'Arthur Shelby', 'Thomas Shelby', 'Polly Gray', 'Ada Thorne', 'John Shelby',
    'Michael Gray', 'Grace Burgess', 'Lizzie Stark', 'Alfie Solomons', 'Luca Changretta',
    'Oswald Mosley', 'Aberama Gold', 'Bonnie Gold', 'May Carleton', 'Tatiana Petrovna',
    'Freddie Thorne', 'Jessie Eden', 'Laura Donnelly', 'Francis Dolarhyde', 'Will Graham',
    'Beverly Katz', 'Jack Crawford', 'Alana Bloom', 'Jimmy Price', 'Brian Zeller'
  ];

  const reasons = [
    'Annual wellness examination and preventive screening',
    'Persistent dry cough and mild shortness of breath',
    'Chronic migraine follow-up and prescription adjustment',
    'Post-operative surgical wound inspection',
    'Hypertension management and blood pressure check',
    'Type 2 Diabetes routine HbA1c consultation',
    'Severe lower back pain radiating to left leg',
    'Allergy flare-up and antihistamine review',
    'Unexplained joint swelling and fatigue',
    'Skin rash evaluation and biopsy consultation',
  ];

  // Distribution of 50 appointments
  // 0-9: Past completed appointments (with visit notes)
  // 10-15: Past NoShows (for 8-week trend testing)
  // 16-20: Past Cancelled appointments
  // 21-25: Today's appointments (CheckedIn, Confirmed, Completed)
  // 26-28: Today's Imminent / Urgent Requested (<1h alert testing)
  // 29-33: Next 24h Requested appointments (24h alert testing)
  // 34-45: Upcoming Confirmed appointments
  // 46-49: Future Requested appointments

  let aptIndex = 0;

  for (let i = 0; i < 50; i++) {
    const patientName = patientNames[i];
    const patientEmail = `${patientName.toLowerCase().replace(/\s+/g, '.')}@patientmail.com`;
    const patientPhone = `+1 (555) 020-${String(1000 + i).padStart(4, '0')}`;
    const reason = reasons[i % reasons.length];
    const schedulingProvider = providers[i % providers.length];

    let slotDateStr = todayStr;
    let startTime = '09:00';
    let endTime = '09:30';
    let duration = 30;
    let status = 'Confirmed';
    let cancellationReason: string | null = null;
    let checkedInAt: Date | null = null;
    let completedAt: Date | null = null;
    let cancelledAt: Date | null = null;

    if (i < 10) {
      // Past Completed (1 to 20 days ago)
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - ((i % 5) + 1) * 3);
      slotDateStr = formatDate(pastDate);
      startTime = `${String(9 + (i % 6)).padStart(2, '0')}:00`;
      endTime = `${String(9 + (i % 6)).padStart(2, '0')}:30`;
      status = 'Completed';
      checkedInAt = new Date(pastDate);
      completedAt = new Date(pastDate);
    } else if (i < 16) {
      // Past NoShow (spread across last 7 weeks for 8-week no show rate chart)
      const weeksAgo = (i - 10) + 1;
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - weeksAgo * 7);
      slotDateStr = formatDate(pastDate);
      startTime = '10:00';
      endTime = '10:30';
      status = 'NoShow';
    } else if (i < 21) {
      // Past Cancelled
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - (i - 15) * 2);
      slotDateStr = formatDate(pastDate);
      startTime = '11:00';
      endTime = '11:30';
      status = 'Cancelled';
      cancelledAt = pastDate;
      cancellationReason = 'Patient called to reschedule due to conflicting business travel.';
    } else if (i < 26) {
      // Today appointments (CheckedIn, Completed, Confirmed)
      slotDateStr = todayStr;
      startTime = `${String(10 + (i - 21)).padStart(2, '0')}:00`;
      endTime = `${String(10 + (i - 21)).padStart(2, '0')}:30`;
      if (i === 21) {
        status = 'CheckedIn';
        checkedInAt = new Date();
      } else if (i === 22) {
        status = 'Completed';
        checkedInAt = new Date(Date.now() - 3600000);
        completedAt = new Date();
      } else {
        status = 'Confirmed';
      }
    } else if (i < 29) {
      // Urgent <1h Requested Appointments for Alert Testing
      slotDateStr = todayStr;
      const currentHours = today.getHours();
      const currentMins = today.getMinutes();
      // Schedule 20 to 45 minutes from now
      const futureMins = (currentMins + 30) % 60;
      const futureHours = (currentHours + (currentMins + 30 >= 60 ? 1 : 0)) % 24;
      startTime = `${String(futureHours).padStart(2, '0')}:${String(futureMins).padStart(2, '0')}`;
      endTime = `${String(futureHours).padStart(2, '0')}:${String((futureMins + 30) % 60).padStart(2, '0')}`;
      status = 'Requested';
    } else if (i < 34) {
      // Within 24h Requested Appointments (Tomorrow or later today)
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      slotDateStr = formatDate(tomorrow);
      startTime = `${String(9 + (i - 29)).padStart(2, '0')}:30`;
      endTime = `${String(10 + (i - 29)).padStart(2, '0')}:00`;
      status = 'Requested';
    } else if (i < 46) {
      // Upcoming Confirmed appointments
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + (i - 33));
      slotDateStr = formatDate(futureDate);
      startTime = `${String(9 + (i % 7)).padStart(2, '0')}:00`;
      endTime = `${String(9 + (i % 7)).padStart(2, '0')}:30`;
      status = 'Confirmed';
    } else {
      // Future Requested
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 5 + (i - 45));
      slotDateStr = formatDate(futureDate);
      startTime = '14:00';
      endTime = '14:30';
      status = 'Requested';
    }

    // 1. Create booked slot
    const slot = await prisma.appointmentSlot.create({
      data: {
        providerId: schedulingProvider.id,
        date: slotDateStr,
        startTime,
        endTime,
        duration,
        isBooked: true,
        isArchived: false,
      },
    });

    // 2. Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        slotId: slot.id,
        schedulingProviderId: schedulingProvider.id,
        patientName,
        patientEmail,
        patientPhone,
        reasonForVisit: reason,
        status,
        cancellationReason,
        checkedInAt,
        completedAt,
        cancelledAt,
        cancelledById: cancellationReason ? frontDesk1.id : null,
      },
    });

    // 3. Add supporting provider for collaborative appointments (every 3rd appointment)
    if (i % 3 === 0) {
      const supportingProvider = providers[(i + 1) % providers.length];
      await prisma.supportingProvider.create({
        data: {
          appointmentId: appointment.id,
          providerId: supportingProvider.id,
          assignedById: frontDesk1.id,
        },
      });

      await prisma.appointmentTimeline.create({
        data: {
          appointmentId: appointment.id,
          userId: frontDesk1.id,
          actionType: 'SUPPORTING_PROVIDER_ADDED',
          newValue: `Dr. ${supportingProvider.specialty} added as supporting consultant`,
        },
      });
    }

    // 4. Add Visit Notes for CheckedIn and Completed appointments
    if (status === 'Completed' || status === 'CheckedIn') {
      const noteContent = `Patient presented for ${reason.toLowerCase()}. Vital signs stable (BP 120/80, HR 72, SpO2 99%). Physical examination unremarkable. Formulated treatment plan and ordered diagnostic panel. Follow-up in 4 weeks.`;
      
      const note = await prisma.visitNote.create({
        data: {
          appointmentId: appointment.id,
          providerId: schedulingProvider.id,
          content: noteContent,
          createdAt: new Date(Date.now() - (50 - i) * 60000),
        },
      });

      await prisma.appointmentTimeline.create({
        data: {
          appointmentId: appointment.id,
          userId: schedulingProvider.userId,
          actionType: 'VISIT_NOTE_CREATED',
          newValue: `Clinical note created: "${noteContent.substring(0, 45)}..."`,
        },
      });
    }

    // 5. Initial Timeline Log for Appointment Creation
    await prisma.appointmentTimeline.create({
      data: {
        appointmentId: appointment.id,
        userId: frontDesk1.id,
        actionType: 'APPOINTMENT_CREATED',
        newValue: `Appointment created for ${patientName} on ${slotDateStr} at ${startTime} with status '${status}'`,
      },
    });

    // If status transitioned, log status change
    if (status !== 'Requested') {
      await prisma.appointmentTimeline.create({
        data: {
          appointmentId: appointment.id,
          userId: frontDesk1.id,
          actionType: status === 'Cancelled' ? 'CANCELLATION' : 'STATUS_CHANGE',
          oldValue: 'Requested',
          newValue: status === 'Cancelled' ? `Cancelled (${cancellationReason})` : status,
        },
      });
    }

    aptIndex++;
  }

  console.log(`Successfully created ${aptIndex} Appointments with Slots, Care Teams, Notes, and Timelines.`);

  // 3. Create unbooked availability slots for testing slot management & booking
  for (let pIdx = 0; pIdx < providers.length; pIdx++) {
    const prov = providers[pIdx];
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const slotD = new Date(today);
      slotD.setDate(today.getDate() + dayOffset);
      const slotDStr = formatDate(slotD);

      await prisma.appointmentSlot.createMany({
        data: [
          {
            providerId: prov.id,
            date: slotDStr,
            startTime: '15:00',
            endTime: '15:30',
            duration: 30,
            isBooked: false,
            isArchived: false,
          },
          {
            providerId: prov.id,
            date: slotDStr,
            startTime: '15:30',
            endTime: '16:00',
            duration: 30,
            isBooked: false,
            isArchived: false,
          },
          {
            providerId: prov.id,
            date: slotDStr,
            startTime: '16:00',
            endTime: '16:30',
            duration: 30,
            isBooked: false,
            isArchived: dayOffset === 4, // 1 archived slot for testing restore
          },
        ],
      });
    }
  }

  console.log('Created additional open & archived slots across providers.');
  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
