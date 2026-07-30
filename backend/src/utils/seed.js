require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Document = require('../models/Document');
const Comment = require('../models/Comment');
const Version = require('../models/Version');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const run = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Document.deleteMany({}),
    Comment.deleteMany({}),
    Version.deleteMany({}),
    Activity.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('Creating users...');
  const alice = await User.create({
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    avatarColor: '#6366f1',
  });

  const bob = await User.create({
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    avatarColor: '#ec4899',
  });

  const carol = await User.create({
    name: 'Carol Davies',
    email: 'carol@example.com',
    password: 'password123',
    avatarColor: '#10b981',
  });

  console.log('Creating documents...');
  const doc1 = await Document.create({
    title: 'Q3 Product Roadmap',
    content: `<h1>Q3 Product Roadmap</h1><p>This document outlines our key priorities for the third quarter.</p><h2>Goals</h2><ul><li>Ship real-time collaboration</li><li>Improve onboarding flow</li><li>Reduce churn by 15%</li></ul><blockquote>Focus on quality over quantity this quarter.</blockquote>`,
    owner: alice._id,
    collaborators: [
      { user: bob._id, role: 'editor' },
      { user: carol._id, role: 'viewer' },
    ],
    coverEmoji: '🚀',
  });

  const doc2 = await Document.create({
    title: 'Engineering Onboarding Guide',
    content: `<h1>Engineering Onboarding Guide</h1><p>Welcome to the team! This guide will help you get set up.</p><h2>Day One Checklist</h2><ul><li data-checked="true">Set up your laptop</li><li data-checked="true">Install VS Code</li><li data-checked="false">Clone the main repository</li></ul>`,
    owner: alice._id,
    collaborators: [{ user: bob._id, role: 'viewer' }],
    coverEmoji: '📘',
  });

  const doc3 = await Document.create({
    title: 'Meeting Notes - Weekly Sync',
    content: `<h1>Weekly Sync Notes</h1><p>Attendees: Bob, Carol</p><h2>Action Items</h2><ol><li>Follow up with design team</li><li>Finalize API contract</li></ol>`,
    owner: bob._id,
    collaborators: [{ user: alice._id, role: 'editor' }],
    coverEmoji: '📝',
    favoritedBy: [bob._id],
  });

  const doc4 = await Document.create({
    title: 'Untitled Document',
    content: '<p></p>',
    owner: alice._id,
    coverEmoji: '📄',
  });

  const trashedDoc = await Document.create({
    title: 'Old Draft (deleted)',
    content: '<p>This was an old draft.</p>',
    owner: alice._id,
    isTrashed: true,
    trashedAt: new Date(),
    coverEmoji: '📄',
  });

  console.log('Creating comments...');
  const comment1 = await Comment.create({
    document: doc1._id,
    author: bob._id,
    text: 'Should we add a timeline for each goal?',
    highlightedText: 'Ship real-time collaboration',
  });
  comment1.replies.push({ author: alice._id, text: 'Good idea, I will add estimated dates.' });
  await comment1.save();

  await Comment.create({
    document: doc1._id,
    author: carol._id,
    text: 'This looks great overall!',
    highlightedText: 'Focus on quality over quantity this quarter.',
    resolved: true,
    resolvedBy: alice._id,
    resolvedAt: new Date(),
  });

  console.log('Creating versions...');
  await Version.create({
    document: doc1._id,
    content: '<h1>Q3 Product Roadmap</h1><p>Initial draft.</p>',
    title: 'Q3 Product Roadmap',
    createdBy: alice._id,
    label: 'First draft',
    wordCount: 4,
  });

  console.log('Creating activity logs...');
  await Activity.create([
    { user: alice._id, document: doc1._id, type: 'document_created' },
    { user: alice._id, document: doc1._id, type: 'document_shared', meta: { email: bob.email } },
    { user: bob._id, document: doc1._id, type: 'comment_added' },
    { user: alice._id, document: doc2._id, type: 'document_created' },
    { user: bob._id, document: doc3._id, type: 'document_created' },
  ]);

  console.log('Creating notifications...');
  await Notification.create([
    {
      recipient: bob._id,
      sender: alice._id,
      document: doc1._id,
      type: 'document_shared',
      message: 'Alice Johnson shared "Q3 Product Roadmap" with you',
    },
    {
      recipient: alice._id,
      sender: bob._id,
      document: doc1._id,
      type: 'comment_added',
      message: 'Bob Smith commented on "Q3 Product Roadmap"',
    },
  ]);

  console.log('\nSeed complete! Sample login credentials:');
  console.log('  alice@example.com / password123');
  console.log('  bob@example.com   / password123');
  console.log('  carol@example.com / password123');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
