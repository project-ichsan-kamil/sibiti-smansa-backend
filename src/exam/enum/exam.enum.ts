export enum ExamType {
    KUIS = 'KUIS',
    UH = 'UH',         // Ulangan Harian
    UTS = 'UTS',       // Ujian Tengah Semester
    UAS = 'UAS',       // Ujian Akhir Semester
  }
  
  export enum StatusExam {
    WAITING_SUBMITTER = 'WAITING_SUBMITTER',    //menunggu disubmit soalnya
    SHOW = 'SHOW',                              //show soal, belum bisa start
    PUBLISH = 'PUBLISH',                        //sudah bsa start
    CLOSE = 'CLOSE',                            //ujian done, masih show
    DRAFT = 'DRAFT',                            //ujian di take down dari siswa
  }
  
  export enum ParticipantType {
    USER = 'USER',      // Ujian individu
    CLASS = 'CLASS',    // Ujian kelas
  }

  export enum ExamDuration {
    D10 = 10,
    D20 = 20,
    D30 = 30,
    D60 = 60,
    D90 = 90,
    D120 = 120,
    D150 = 150,
    D180 = 180,
  }
  
  export enum SumQuestion {
    Q5 = 5,
    Q10 = 10,
    Q15 = 15,
    Q20 = 20,
    Q25 = 25,
    Q30 = 30,
    Q35 = 35,
    Q40 = 40,
    Q45 = 45,
    Q50 = 50,
  }
  
  export enum SumOption {
    O4 = 4,
    O5 = 5,
    O6 = 6,
  }
  