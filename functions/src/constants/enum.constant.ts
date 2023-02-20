// For query purpose because type null has some trouble with
// firestore query ('where in' for example)
export const appNull = 'NULL' as const;
export type AppNull = typeof appNull;

export const platformList = ['ios', 'android', 'web'] as const;
export type Platform = typeof platformList[number];

// This is to resolve the need of using one auth account as multiple app roles
export const authRoleList = ['patient', 'doctor', 'staff', 'user'] as const;
export type AuthRole = typeof authRoleList[number];

export const patientStatusList = ['activated', 'deactivated'] as const;
export type PatientStatus = typeof patientStatusList[number];

export const genderList = ['male', 'female', 'other'] as const;
export type Gender = typeof genderList[number];

export const doctorStatusList = [
  'activated',
  'deactivated',
  'inReview',
] as const;
export type DoctorStatus = typeof doctorStatusList[number];

export const appointmentStatusList = [
  'doctorReviewing',
  'doctorCanceled',
  'patientCanceled',
  'patientConfirming',
  'beforeMeeting',
  'duringMeeting',
  'doctorConcluding',
  'done',
] as const;
export type AppointmentStatus = typeof appointmentStatusList[number];

export const appointmentRecordTypeList = [
  'patientRequestAppointment',
  'patientConfirmAppointment',
  'patientProvideMedicalForm',
  'appointmentEnded',
  'doctorGiveGuidance',
  'doctorCreatePrivateNote',
] as const;
export type AppointmentRecordType = typeof appointmentRecordTypeList[number];

export const noteTypeList = ['basicNote'] as const;
export type NoteType = typeof noteTypeList[number];

export const transactionStatusList = [
  'waiting',
  'transfered',
  'rejected',
  'canceledByDoctor',
] as const;
export type TransactionStatus = typeof transactionStatusList[number];

export const transactionTypeList = ['deposit', 'withdrawal', 'income'] as const;
export type TransactionType = typeof transactionTypeList[number];

export const scheduleRecurringList = [
  'daily',
  'weekly',
  'everyWeekday',
  'everyWeekend',
] as const;
export type ScheduleRecurring = typeof scheduleRecurringList[number];

export const medicalFormTypeList = [
  'medicalHistory',
  'vitalSigns',
  'testResults',
  'currentPrescription',
] as const;
export type MedicalFormType = typeof medicalFormTypeList[number];

export const guidanceTypeList = ['prescription', 'note'] as const;
export type GuidanceType = typeof guidanceTypeList[number];

export const guidanceUnitList = [
  'tablet',
  'pack',
  'liquid',
  'tube',
  'drop',
  // 'type',
] as const;
export type GuidanceUnit = typeof guidanceUnitList[number];

export const userStateList = ['pending', 'joined', 'left'] as const;
export type UserState = typeof userStateList[number];

export const devicePlatformList = ['android', 'ios'] as const;
export type DevicePlatform = typeof devicePlatformList[number];

export const MessageNotiDoctor = {
  newRequest: {
    title: 'Có yêu cầu mới',
    description: 'Bạn có yêu cầu tư vấn mới từ bệnh nhân',
  },
  confirmByUser: {
    title: 'Xác nhận lịch tư vấn',
    description: 'Bệnh nhân đã chọn lịch tư vấn',
  },
  paymentByUser: {
    title: 'Xác nhận lịch tư vấn',
    description: 'Bệnh nhân đã thanh toán và chọn lịch tư vấn',
  },
  cancel: {
    title: 'Yêu cầu bị từ chối',
    description: 'Bệnh nhân đã từ chối tư vấn',
  },
  receiveMedicalForm: {
    title: 'Nhận được thông tin y tế',
    description: 'Bệnh nhân đã điền thông tin y tế bạn yêu cầu',
  },
  patientJoined: {
    title: 'Bệnh nhân đã tham gia tư vấn',
    description: 'Bệnh nhân đã tham gia vào buổi tư vấn',
  },
  remindTime: {
    title: 'Sắp đến giờ tư vấn',
    description: 'Còn 30 phút nữa là đến giờ tư vấn theo lịch hẹn',
  },
  withdrawalTransfered: {
    title: 'Rút tiền hoàn tất',
    description: 'Hệ thống đã chuyển tiền cho bạn',
  },
  withdrawalRejected: {
    title: 'Rút tiền bị từ chối',
    description: 'Yêu cầu rút tiền của bạn đã bị từ chối',
  },
  accountActivated: {
    title: 'Tài khoản đã được kích hoạt',
    description: 'Tài khoản của bạn đã được kích hoạt',
  },
};

export const MessageNotiPatient = {
  adviceAccepted: {
    title: 'Yêu cầu được chấp nhận',
    description: 'Bác sĩ đã chấp nhận tư vấn cho bạn',
  },
  cancel: {
    title: 'Yêu cầu bị từ chối',
    description: 'Bệnh nhân đã từ chối tư vấn',
  },
  requestMedicalForm: {
    title: 'Yêu cầu điền thông tin y tế',
    description: 'Bác sĩ yêu cầu bạn điền thông tin y tế',
  },
  receiveGuidance: {
    title: 'Nhận được hướng dẫn',
    description: 'Bác sĩ đã gửi hướng dẫn cho bạn',
  },
  doctorJoined: {
    title: 'Bác sĩ đã tham gia tư vấn',
    description: 'Bác sĩ đã tham gia vào buổi tư vấn',
  },
  remindTime: {
    title: 'Sắp đến giờ tư vấn',
    description: 'Còn 30 phút nữa là đến giờ tư vấn theo lịch hẹn',
  },
};
