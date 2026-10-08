export interface HealthCentre {
  id: string;
  name: string;
  distance: string;
  distanceValue: number;
}

export const HEALTH_CENTRES: HealthCentre[] = [
  {
    id: "chirakkal",
    name: "Chirakkal",
    distance: "600m",
    distanceValue: 600
  },
  {
    id: "pappinisseri",
    name: "Pappinisseri",
    distance: "3.4km",
    distanceValue: 3400
  },
  {
    id: "azhikode",
    name: "Azhikode",
    distance: "3.6km",
    distanceValue: 3600
  },
  {
    id: "pallikunnu",
    name: "Pallikunnu",
    distance: "4.8km",
    distanceValue: 4800
  },
  {
    id: "valapattanam",
    name: "Valapattanam",
    distance: "2.4km",
    distanceValue: 2400
  },
  {
    id: "puzhathi",
    name: "Puzhathi",
    distance: "2.5km",
    distanceValue: 2500
  },
  {
    id: "kalliasseri",
    name: "Kalliasseri",
    distance: "6.3km",
    distanceValue: 6300
  }
];
