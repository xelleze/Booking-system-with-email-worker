export interface BookingInput {
  name: string;
  email: string;
  move_date: string;
  moving_address: string;
}

export interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export type BookingEmailJob = {
  customerId: number;
  email: string;
  name: string;
  move_date: string;
  moving_address: string;
};
