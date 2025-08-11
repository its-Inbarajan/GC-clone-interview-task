import moment, { type Moment } from "moment";

export function getMonthDays(year: number, month: number) {
  const startOfMonth = moment([year, month]);
  const endOfMonth = startOfMonth.clone().endOf("month");
  const startDate = startOfMonth.clone().startOf("week");
  const endDate = endOfMonth.clone().endOf("week");

  const days: moment.Moment[] = [];
  const date = startDate.clone();

  while (date.isBefore(endDate, "day")) {
    days.push(date.clone());
    date.add(1, "day");
  }

  return days;
}

export function isSelectedIndex(
  selStartIndex: null | number,
  selEndIndex: null | number,
  idx: number
) {
  if (selStartIndex === null || selEndIndex === null) return false;
  const start = Math.min(selStartIndex, selEndIndex);
  const end = Math.max(selStartIndex, selEndIndex);
  return idx >= start && idx <= end;
}

export function dayIndexOf(days: Moment[], dateStr: string) {
  return days.findIndex((d) => d.isSame(moment(dateStr), "day"));
}
