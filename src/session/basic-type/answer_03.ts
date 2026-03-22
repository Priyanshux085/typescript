import * as BUN from "bun"; 

/**
 * @question3:
 * You are tracking appointments. Create a base class `Appointment<IdType>` with `id: IdType`, `date: Date`, and `location: string`. 
 * Then create `DoctorVisit` that extends `Appointment<string>` with `doctorName: string` and a `details()` method 
 * that returns a readable summary.
 * 
 * TypeScript constraints:
 * - Use generics to allow for different types of appointment IDs (e.g., string, number).
 * - Implement error handling in the `details()` method to ensure all necessary information is provided.
 * - Ensure that the `date` property is always a valid date and not in the past when creating a new appointment.
 * 
 * Real-life extension:
 * - Add a `PatientVisit` class that extends `Appointment<number>` with `patientName: string` and a `summary()` method.
 * - Integrate with a simple in-memory database (e.g., an array) to store and retrieve appointments.
 */

interface IAppointment<T> {
  id: T,
  date: Date,
  location: string
}

type detailsObjetct = {
  doctorName: string,
  location: string,
  date: Date
}

interface IDoctorVisit extends IAppointment<string> {
  doctorName: string,
  details(): detailsObjetct
}

class DoctorVisit implements IDoctorVisit {
  constructor(
    public doctorName: string,
    public location: string
  ) {}

  private Id = BUN.randomUUIDv7() as string; // make it unique and immutable
  
  get id() {
    return this.Id;
  }
  
  // set date to current date by default, can be overridden in the future if needed
  date: Date = new Date();

  details(): detailsObjetct {
    const result: detailsObjetct = {
      doctorName: this.doctorName,
      location: this.location,
      date: this.date
    } as const;

    return result;
  }
}

const doctorVisit = new DoctorVisit("Dr. Smith", "123 Main St");
console.log(doctorVisit.details());

// -------------

type summaryObject = {
  patientName: string,
  location: string,
  date: Date
}

interface IPatientVisit extends IAppointment<number> {
  patientName: string,
  summary(): summaryObject
}

class PatientVisit implements IPatientVisit {
  constructor(
    public patientName: string,
    public location: string,
  ) {}
  get date() {
    return new Date();
  }
  
  get id() {
    return BUN.randomUUIDv7("base64") as unknown as number;
  }
  
  
  summary(): summaryObject {
    if (!this.patientName || !this.location) {
      throw new Error("Patient name and location must be provided");
    }
    return {
      patientName: this.patientName,
      location: this.location,
      date: this.date
    } as const;
  }
}

const patientVisit = new PatientVisit("John Doe", "456 Elm St");
console.log(patientVisit.summary());