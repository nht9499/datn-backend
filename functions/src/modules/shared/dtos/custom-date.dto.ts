import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'customDateString', async: false })
export class CustomDateString implements ValidatorConstraintInterface {
  validate(date: string, args: ValidationArguments) {
    const dateFormat = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/;
    if (date.match(dateFormat)) {
      const pdate = date.split('-');
      const yyyy = parseInt(pdate[0]);
      const mm = parseInt(pdate[1]);
      const dd = parseInt(pdate[2]);
      const ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (mm == 1 || mm > 2) {
        if (dd > ListofDays[mm - 1]) {
          return false;
        }
      }
      if (mm == 2) {
        let lyear = false;
        if ((!(yyyy % 4) && yyyy % 100) || !(yyyy % 400)) {
          lyear = true;
        }
        if (lyear == false && dd >= 29) {
          return false;
        }
        if (lyear == true && dd > 29) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }
  defaultMessage(args: ValidationArguments) {
    return `Invalid date`;
  }
}

@ValidatorConstraint({ name: 'customTimeString', async: false })
export class CustomTimeString implements ValidatorConstraintInterface {
  validate(time: string, args: ValidationArguments) {
    return /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(time);
  }
  defaultMessage(args: ValidationArguments) {
    return `Invalid time`;
  }
}

@ValidatorConstraint({ name: 'customMonthString', async: false })
export class CustomMonthString implements ValidatorConstraintInterface {
  validate(time: string, args: ValidationArguments) {
    return /^\d{4}\-(0?[1-9]|1[012])$/.test(time);
  }
  defaultMessage(args: ValidationArguments) {
    return `Invalid time`;
  }
}
