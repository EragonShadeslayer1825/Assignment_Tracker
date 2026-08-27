# Assignment Tracker

A simple assignment tracker made to keep assignments for the whole batch in one place instead of having them scattered across WhatsApp messages.

## 🌐 Website

**https://assignment-tracker-iiitb.vercel.app**

You can now open the **main domain directly** and select your year + department from the home page.

You can also go directly to a class using its link:

- `https://assignment-tracker-iiitb.vercel.app/1-cse` → 1st Year CSE
- `https://assignment-tracker-iiitb.vercel.app/4-ece` → 4th Year ECE
- `https://assignment-tracker-iiitb.vercel.app/1-aids` → 1st Year AI & DS

The format is:

`/<year>-<department>`

---

## What it does

The tracker is designed to work across **all years and departments** such as CSE, ECE, AI & DS, etc.

Students can easily check upcoming assignments, due dates and older assignments, with both **list and calendar views**. Assignments are automatically handled based on their due dates and can be archived for later reference.

### For CRs / Class Admins

CRs or the person responsible for a class can get admin access to:

- Add and edit assignments
- Delete incorrect assignments
- Archive and restore assignments
- Manage archived assignments for their class

Each class admin is restricted to their own class.

### Master Admin

There is also a **Master Admin** account for overall management.

The Master Admin can manage all classes and has access to a **Clear Everything** function, intended mainly for the end of an academic year when the assignment data needs to be reset.

---

## 🔐 Admin Access

Admin accounts and passwords are kept private and are **not stored in this repository**.

If you are a CR / person in charge and want to manage your class, contact me directly for the admin credentials.

Once you have them:

1. Open the main website.
2. Select your class.
3. Open the **Admin** section.
4. Log in using the credentials provided to you.

Class admins can only manage assignments belonging to their assigned class.

---

## Tech Stack

- React
- Vite
- React Router
- Supabase
- Vercel

## Security

- Supabase authentication
- Role-based access for Class Admins and Master Admin
- Class-level permissions
- Row Level Security (RLS)
- Protected database functions for sensitive operations
- Secret environment variables are kept out of the repository

---

## Feedback

If you find a bug, have a feature suggestion, or want your class added, feel free to contact me.