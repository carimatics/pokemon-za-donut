export interface Flavors {
  sweet: number;
  spicy: number;
  sour: number;
  bitter: number;
  fresh: number;
}

export interface Berry {
  id: string;
  name: string;
  level: number;
  calories: number;
  flavors: Flavors;
  hyper: boolean;
}

export interface BerryStock {
  berry: Berry;
  count: number;
}

export interface Donut {
  id: string;
  name: string;
  flavors: Flavors;
}

export interface DonutRecipe {
  donut: Donut;
  stocks: BerryStock[];
}
