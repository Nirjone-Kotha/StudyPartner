import { PrismaClient, PostType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const AV = (seed: string) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=EFEAFE,FFE7E0,FFF6DC`;
const PIC = (id: number, w = 800, h = 500) =>
  `https://picsum.photos/id/${id}/${w}/${h}`;

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // Users
  const defaultPasswordHash = await hash('password123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@funstore.app' },
    update: { password: defaultPasswordHash, isAdmin: true },
    create: {
      email: 'admin@funstore.app',
      handle: 'studypartner',
      name: 'Study Partner Team',
      password: defaultPasswordHash,
      avatar: AV('funstore-official'),
      bio: 'Official Study Partner updates',
      isAdmin: true,
    },
  });

  const adminCom = await prisma.user.upsert({
    where: { email: 'admin@funstore.com' },
    update: { password: defaultPasswordHash, isAdmin: true },
    create: {
      email: 'admin@funstore.com',
      handle: 'admin',
      name: 'System Admin',
      password: defaultPasswordHash,
      avatar: AV('admin-system'),
      bio: 'System Administrator',
      isAdmin: true,
    },
  });

  const priya = await prisma.user.upsert({
    where: { email: 'priya@example.com' },
    update: { password: defaultPasswordHash },
    create: {
      email: 'priya@example.com',
      handle: 'priya.n',
      name: 'Priya Nandy',
      password: defaultPasswordHash,
      avatar: AV('priya'),
      bio: 'Baker 🍰 · Dhaka',
      friends: 342,
    },
  });

  const rafiul = await prisma.user.upsert({
    where: { email: 'rafiul@example.com' },
    update: { password: defaultPasswordHash },
    create: {
      email: 'rafiul@example.com',
      handle: 'rafiul.k',
      name: 'Rafiul Karim',
      password: defaultPasswordHash,
      avatar: AV('rafiul'),
      bio: 'Photographer · Sylhet',
      friends: 512,
    },
  });

  const tanvir = await prisma.user.upsert({
    where: { email: 'tanvir@example.com' },
    update: { password: defaultPasswordHash },
    create: {
      email: 'tanvir@example.com',
      handle: 'tanvir.a',
      name: 'Tanvir Ahmed',
      password: defaultPasswordHash,
      avatar: AV('tanvir'),
      bio: 'Web developer',
      friends: 231,
    },
  });

  const meherun = await prisma.user.upsert({
    where: { email: 'meherun@example.com' },
    update: { password: defaultPasswordHash },
    create: {
      email: 'meherun@example.com',
      handle: 'meherun',
      name: 'Meherun Nesa',
      password: defaultPasswordHash,
      avatar: AV('meherun'),
      bio: 'Traveler ✈️',
      friends: 890,
    },
  });

  // Seed posts
  const welcome = await prisma.post.upsert({
    where: { id: 'seed-post-1' },
    update: {},
    create: {
      id: 'seed-post-1',
      userId: admin.id,
      text: 'Welcome to Study Partner! 🎉 Share your thoughts, photos, or create MCQ polls to engage your community.',
      mediaUrl: PIC(1015),
      mediaType: 'IMAGE',
      featured: true,
      pinned: true,
      type: 'TEXT',
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-2' },
    update: {},
    create: {
      id: 'seed-post-2',
      userId: priya.id,
      text: 'Fresh batch of cardamom rolls just came out of the oven 😋 Will share the recipe soon!',
      mediaUrl: PIC(292),
      mediaType: 'IMAGE',
      type: 'TEXT',
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-3' },
    update: {},
    create: {
      id: 'seed-post-3',
      userId: rafiul.id,
      text: 'Golden hour over the tea gardens this morning. Sylhet never disappoints 🌄',
      mediaUrl: PIC(1016),
      mediaType: 'IMAGE',
      type: 'TEXT',
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-4' },
    update: {},
    create: {
      id: 'seed-post-4',
      userId: tanvir.id,
      text: 'Finally shipped the redesign for our team dashboard. Small UI tweaks, huge difference in usability 🚀',
      explanation:
        'Good UI design reduces cognitive load. By decluttering the interface and improving visual hierarchy, users can find information faster and make fewer errors.',
      type: 'TEXT',
    },
  });

  // Poll 1
  const pollPost1 = await prisma.post.upsert({
    where: { id: 'seed-poll-1' },
    update: {},
    create: {
      id: 'seed-poll-1',
      userId: tanvir.id,
      type: PostType.POLL,
      explanation:
        'Python is widely recommended for beginners because of its clean syntax, readability, and versatility.',
    },
  });

  const existingPoll1 = await prisma.poll.findUnique({ where: { postId: pollPost1.id } });
  if (!existingPoll1) {
    await prisma.poll.create({
      data: {
        postId: pollPost1.id,
        question: 'Which programming language is best for beginners to learn first?',
        correctAnswer: 0,
        options: {
          create: [
            { label: 'Python', votes: 42, order: 0 },
            { label: 'JavaScript', votes: 28, order: 1 },
            { label: 'Java', votes: 10, order: 2 },
            { label: 'C++', votes: 6, order: 3 },
          ],
        },
      },
    });
  }

  // Poll 2
  const pollPost2 = await prisma.post.upsert({
    where: { id: 'seed-poll-2' },
    update: {},
    create: {
      id: 'seed-poll-2',
      userId: meherun.id,
      type: PostType.POLL,
      explanation:
        'The mitochondria is known as the powerhouse of the cell. It generates most of the ATP used as chemical energy.',
    },
  });

  const existingPoll2 = await prisma.poll.findUnique({ where: { postId: pollPost2.id } });
  if (!existingPoll2) {
    await prisma.poll.create({
      data: {
        postId: pollPost2.id,
        question: 'What is the powerhouse of the cell?',
        correctAnswer: 1,
        options: {
          create: [
            { label: 'Nucleus', votes: 12, order: 0 },
            { label: 'Mitochondria', votes: 87, order: 1 },
            { label: 'Ribosome', votes: 5, order: 2 },
            { label: 'Golgi apparatus', votes: 3, order: 3 },
          ],
        },
      },
    });
  }

  // Seed Groups
  const bcsGroup = await prisma.group.upsert({
    where: { id: 'seed-group-1' },
    update: {},
    create: {
      id: 'seed-group-1',
      name: '46th BCS Preparation Hub 📚',
      description: 'Daily model tests, MCQ discussions, and general knowledge updates for BCS aspirants.',
      category: 'BCS Preparation',
      creatorId: tanvir.id,
      members: {
        create: [
          { userId: tanvir.id, role: 'ADMIN' },
          { userId: priya.id, role: 'MEMBER' },
          { userId: meherun.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const medicalGroup = await prisma.group.upsert({
    where: { id: 'seed-group-2' },
    update: {},
    create: {
      id: 'seed-group-2',
      name: 'Medical Aspirants Bangladesh 🩺',
      description: 'Biology, Chemistry, Physics discussions and solving past year medical admission questions.',
      category: 'Medical Aspirants',
      creatorId: priya.id,
      members: {
        create: [
          { userId: priya.id, role: 'ADMIN' },
          { userId: meherun.id, role: 'MEMBER' },
          { userId: rafiul.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const csGroup = await prisma.group.upsert({
    where: { id: 'seed-group-3' },
    update: {},
    create: {
      id: 'seed-group-3',
      name: 'Computer Science & Coding Hub 💻',
      description: 'Programming problem solving, web development tutorials, and algorithms discussion.',
      category: 'Science & Technology',
      creatorId: tanvir.id,
      members: {
        create: [
          { userId: tanvir.id, role: 'ADMIN' },
          { userId: rafiul.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Seed Notifications for Priya
  await prisma.notification.createMany({
    data: [
      {
        userId: priya.id,
        actorId: tanvir.id,
        type: 'FRIEND_ACCEPT',
        title: 'Friend Request Accepted',
        message: 'accepted your friend request.',
        targetUrl: `/profile?handle=${tanvir.handle}`,
        read: false,
      },
      {
        userId: priya.id,
        actorId: meherun.id,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: 'sent you a friend request.',
        targetUrl: '/friends',
        read: false,
      },
      {
        userId: priya.id,
        actorId: tanvir.id,
        type: 'GROUP_INVITE',
        title: 'Group Invitation',
        message: 'invited you to join "46th BCS Preparation Hub 📚"',
        targetUrl: `/groups/${bcsGroup.id}`,
        read: false,
      },
      {
        userId: priya.id,
        actorId: admin.id,
        type: 'ADMIN_ANNOUNCEMENT',
        title: 'Welcome to Study Partner! 🎓',
        message: 'Explore study groups, participate in MCQ polls, and connect with fellow learners.',
        targetUrl: '/feed',
        read: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
