import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor() { }
  getErrorMessage(form: FormGroup, field: string,msg:string): string {
    let message: string = '';
    if (form?.get(field)?.hasError('required')) {
      message = 'Campo requerido';
    } else if (form?.get(field)?.invalid) {
      message = msg;
    }
    return message;
  }

  checkErrors(form: FormGroup, field: string) {
    return (
      (form.get(field)?.touched || form.get(field)?.dirty) &&
      form.get(field)?.invalid
    );
  }
}
