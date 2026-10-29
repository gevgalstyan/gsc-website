/** Shared browser-safe validation. Age is a non-negative snapshot, not a birth date. */
export const TERMS_VERSION = "2026-10-29";
export const GENDERS = ["Male", "Female", "Prefer not to say"] as const;
const countryCodes = "AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW".split(" ");
const regions = new Intl.DisplayNames(["en"], { type: "region" });
export const NATIONALITIES = [...countryCodes.map((code) => regions.of(code)!), "Stateless", "Other / not listed"].sort();
export type RegistrationDetails = { first_name: string; surname: string; age: string; nationality: string; gender: string };
export type RegistrationFields = RegistrationDetails & { email: string; password: string; confirmation: string; agreement: boolean };
export function validateDetails(values: RegistrationDetails) {
  const errors: Record<string, string> = {};
  for (const key of ["first_name", "surname"] as const) {
    if (!values[key].trim()) errors[key] = key === "first_name" ? "Enter your first name." : "Enter your surname.";
    else if (values[key].trim().length > 80) errors[key] = "Use 80 characters or fewer.";
  }
  if (!/^\d+$/.test(values.age) || !Number.isSafeInteger(Number(values.age)) || Number(values.age) > 2147483647) errors.age = "Enter your age as a whole, non-negative number.";
  if (!NATIONALITIES.includes(values.nationality)) errors.nationality = "Choose a nationality from the suggestions.";
  if (!(GENDERS as readonly string[]).includes(values.gender)) errors.gender = "Choose a gender option.";
  return errors;
}
export function validEmail(value: string) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function validateRegistration(values: RegistrationFields) {
  const errors = validateDetails(values);
  if (!validEmail(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  if (values.password !== values.confirmation) errors.confirmation = "Passwords do not match.";
  if (!values.agreement) errors.agreement = "Please agree to the Terms and Privacy Policy.";
  return errors;
}
