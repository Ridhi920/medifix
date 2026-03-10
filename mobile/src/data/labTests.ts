// Lab center locations for UI dropdown selection
export type LabCenter = {
  id: string;
  name: string;
  address: string;
  rating: string;
  distance: string;
};

export const LAB_CENTERS: LabCenter[] = [
  {
    id: "center-1",
    name: "City Diagnostics Center",
    address: "123 Main Street, Downtown",
    rating: "4.8",
    distance: "2.3 km"
  },
  {
    id: "center-2",
    name: "Medical Lab Services",
    address: "456 Health Avenue, Uptown",
    rating: "4.6",
    distance: "3.5 km"
  },
  {
    id: "center-3",
    name: "Advanced Diagnostics",
    address: "789 Care Boulevard, Midtown",
    rating: "4.9",
    distance: "1.8 km"
  }
];
