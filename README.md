# Assignment Tracker

A simple assignment tracker for keeping assignments in one place for the entire batch.

## 🚨 IMPORTANT — HOW TO OPEN YOUR CLASS

**DO NOT use the main domain by itself.**

The main domain is only the base URL. You need to add your **year + department** at the end.

### Examples

**1st Year CSE**
https://assignment-tracker-iiitb.vercel.app/1-cse

**4th Year ECE**
https://assignment-tracker-iiitb.vercel.app/4-ece

**1st Year AI & DS**
https://assignment-tracker-iiitb.vercel.app/1-aids

The format is:

`https://assignment-tracker-iiitb.vercel.app/<year>-<department>`

So if you open only:

https://assignment-tracker-iiitb.vercel.app

you may not see the assignment tracker. **That's normal — add your class to the URL.**

---

## What is it?

Assignment Tracker is made to keep assignments for a batch in one place instead of having them scattered across WhatsApp messages.

It supports different departments and years, with each class having its own tracker.

### Features

- 📚 Class-specific assignment trackers for different departments and years
- ✏️ CRs / admins can add, edit, delete and archive assignments
- 📅 List and calendar views with automatic handling of past due dates
- 📦 Archived assignments remain available for reference
- 🔐 Class admins can only manage their own class
- 👑 A **Master Admin** can manage all classes and perform the year-end reset when required

---

## For Students

No login is required to view assignments.

Just open your class link.

For example:

`https://assignment-tracker-iiitb.vercel.app/1-cse`

---

## For CRs / Class Admins

CRs or the person responsible for maintaining a class can get admin access.

Admin access allows you to:

- Add assignments
- Edit assignments
- Delete incorrect assignments
- Archive old assignments
- Restore archived assignments
- Clear archived assignments for your class

### How to get admin access

**Admin passwords are kept private and are not stored in this repository.**

If you are a CR / person in charge and want admin access, **contact me directly for the credentials.**

Once you have the credentials:

1. Open your class tracker.
2. Click **Admin**.
3. Enter the provided admin account and password.
4. You will then get the admin controls for your class.

### Important

A class admin can only manage the class they are assigned to.

For example, a `1 CSE` admin cannot add or edit assignments in `4 ECE`.

---

## Master Admin

There is also a **Master Admin** account for overall management.

The Master Admin can manage all class trackers and has access to the **Clear EVERYTHING** function.

This is intended for major/year-end transitions and permanently removes assignments across all classes while keeping the class structure and admin accounts intact.

**Master Admin credentials are private and are not included in this repository.**

---

## Live Website

### Main domain

https://assignment-tracker-iiitb.vercel.app

**Remember: the main domain is not a class tracker by itself.**

Add your class to the URL:

`/1-cse`  
`/4-ece`  
`/1-aids`  
etc.

---

## Tech Stack

- React
- Vite
- Supabase
- React Router
- Vercel

## Security

- Supabase authentication for admin accounts
- Role-based access for Master and Class Admins
- Class-level permissions
- Row Level Security (RLS)
- Sensitive database operations handled through protected database functions
- Admin passwords and secret environment variables are not committed to GitHub

---

## Feedback

If you find a bug, have a suggestion, or want your class added, feel free to contact me.
