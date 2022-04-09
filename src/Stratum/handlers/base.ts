
export interface StratumRequest {
  id: number;
  method: string;
  params: any[];
}

export interface StratumResponse {
  id?: number;
  result: any;
  error?: any[];
}

export interface StratumHandler  {
  (request: StratumRequest): Promise<StratumResponse>;
}

export interface StratumHandlers  {
  [key: string]: StratumHandler;
}

