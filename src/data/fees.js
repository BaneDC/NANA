// What a visit costs and what of it reaches the caregiver: the hours at the
// agreed rate, less the platform's 10%.
export const SERVICE_FEE = 0.1;

export function totalsFor(hours, rate) {
  const charged = hours * rate;
  // to the cent, and net worked in cents too so 15,20 € less 1,52 € is not
  // 13,680000000000001
  const fee = Math.round(charged * SERVICE_FEE * 100) / 100;
  const net = Math.round(charged * 100 - fee * 100) / 100;
  return { charged, fee, net };
}
