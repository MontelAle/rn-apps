/**
 * Fixtures the faculty flow tests navigate through.
 *
 * Unlike the students app — where every screen is driven by an API response
 * mocked through MSW — the faculty app is still a prototype: its screens read
 * from the in-memory fixtures hardcoded in `~/core/contexts/CoursesContext`.
 * There is no request to intercept, so these constants are not response bodies
 * but pointers to the rows of that context the tests act on. Keep them in sync
 * with CoursesContext as the app moves onto the real API.
 */

/**
 * `fakeCourses[3]`. Picked over the other assigned courses because no exam
 * call shares its name, so its title is unambiguous on the Teaching home
 * screen (which renders courses and exam calls in sibling sections).
 */
export const TEST_COURSE = {
  title: 'Chimica',
  code: 'CHM101',
  /** The only course of its academic year, so the year heading is unique too. */
  academicYear: '2024/2025',
  /** Its single notice. */
  notice: {
    title: 'Avviso',
    content: 'Aggiornamenti sul laboratorio di Chimica disponibili.',
  },
};

/** `managedCourses[0]`, listed in the Teaching home "Managed Courses" section. */
export const TEST_MANAGED_COURSE = {
  title: 'Informatica Teorica',
  code: 'INF201',
};

/**
 * `fakeExams[0]`. The Teaching home lists the first three exam calls and this
 * is the only one dated `Oggi`, so its "Today" subtitle identifies the row.
 */
export const TEST_EXAM_CALL = {
  subject: 'Matematica',
  where: 'Aula 3',
  booked: 89,
  /** The first two of its booked students, both within the initial render. */
  students: [
    { id: 'S317601', fullName: 'Luca Bianchi' },
    { id: 'S317602', fullName: 'Giulia Rossi' },
  ],
};
