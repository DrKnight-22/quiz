import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkanruuzfkokvtcqabkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYW5ydXV6Zmtva3Z0Y3FhYmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNzAzMjIsImV4cCI6MjA2MTY0NjMyMn0.3Ne0Q8pWWvuEIp5A3Tk6Ienpjt5-_LxQjX8L8IS5I3w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);