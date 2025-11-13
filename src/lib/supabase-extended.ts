// Extended Supabase types to work around type sync issues
// This file provides type-safe wrappers for tables not yet in the generated types

import { supabase } from "@/integrations/supabase/client";

// Type-safe wrapper for notifications table
export const notifications = {
  select: (...args: any[]) => (supabase as any).from("notifications").select(...args),
  insert: (data: any) => (supabase as any).from("notifications").insert(data),
  update: (data: any) => (supabase as any).from("notifications").update(data),
  delete: () => (supabase as any).from("notifications").delete(),
};

// Type-safe wrapper for support_tickets table
export const support_tickets = {
  select: (...args: any[]) => (supabase as any).from("support_tickets").select(...args),
  insert: (data: any) => (supabase as any).from("support_tickets").insert(data),
  update: (data: any) => (supabase as any).from("support_tickets").update(data),
  delete: () => (supabase as any).from("support_tickets").delete(),
};

// Type-safe wrapper for photo_reports table
export const photo_reports = {
  select: (...args: any[]) => (supabase as any).from("photo_reports").select(...args),
  insert: (data: any) => (supabase as any).from("photo_reports").insert(data),
  update: (data: any) => (supabase as any).from("photo_reports").update(data),
  delete: () => (supabase as any).from("photo_reports").delete(),
};

// Type-safe wrapper for admin_users table
export const admin_users = {
  select: (...args: any[]) => (supabase as any).from("admin_users").select(...args),
  insert: (data: any) => (supabase as any).from("admin_users").insert(data),
  update: (data: any) => (supabase as any).from("admin_users").update(data),
  delete: () => (supabase as any).from("admin_users").delete(),
};

// Type-safe wrapper for profiles with extended fields
export const profilesExtended = {
  select: (...args: any[]) => supabase.from("profiles").select(...args),
  insert: (data: any) => supabase.from("profiles").insert(data),
  update: (data: any) => supabase.from("profiles").update(data as any),
  delete: () => supabase.from("profiles").delete(),
};
