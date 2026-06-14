export type TuitionType = 'home' | 'online' | 'home_visit'
export type AttendanceStatus = 'present' | 'absent' | 'leave'
export type Audience = 'all' | 'home' | 'online' | 'home_visit'

export interface Student {
  id: string
  teacher_id: string
  student_name: string
  parent_name: string | null
  parent_email: string | null
  parent_mobile: string | null
  class_grade: string | null
  tuition_type: TuitionType
  subjects: string[]
  joining_date: string
  monthly_fee: number | null
  portal_token: string
  is_active: boolean
}

export interface Batch {
  id: string
  teacher_id: string
  name: string
  description: string | null
}

export interface ClassUpdate {
  id: string
  batch_id: string | null
  subject: string | null
  topic_covered: string | null
  homework: string | null
  teacher_remarks: string | null
  class_date: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  audience: Audience
  created_at: string
}

export const TUITION_LABELS: Record<TuitionType, string> = {
  home: 'Home', online: 'Online', home_visit: 'Home Visit'
}
