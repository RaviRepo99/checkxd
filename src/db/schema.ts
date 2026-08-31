import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  title: text('title'),
  department: text('department'),
  email: text('email').notNull(),
  photo: text('photo'),
  photoThumb: text('photo_thumb'),
  photoVersion: integer('photo_version').default(0).notNull(),
  memberYear: integer('member_year').notNull(),
  teamId: text('team_id')
      .notNull()
      .references(() => teams.id),
  collegeYear: integer('college_year'),
  socials: jsonb('socials').$type<{
    github?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  image: text('image').notNull(),
  status: text('status', {enum: ['upcoming', 'past', 'running']}).notNull(),
  registrationLink: text('registration_link'),
  tags: jsonb('tags').$type<string[]>(),
  gallery: jsonb('gallery').$type<string[]>(),
  academicYear: integer('academic_year').default(2025).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const donations = pgTable('donations', {
  id: serial('id').primaryKey(),
  referenceId: text('reference_id').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  message: text('message'),
  amount: integer('amount').notNull(),
  currency: text('currency').default('NPR').notNull(),
  paymentMethod: text('payment_method'),
  transactionId: text('transaction_id'),
  proofFileName: text('proof_file_name'),
  status: text('status', {enum: ['pending', 'confirmed']}).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
