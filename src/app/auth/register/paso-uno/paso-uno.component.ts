import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, Output,EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import { BACK, CHECK, FIRST_NUMBER, KEY_ENCRYPT_DESENCRYPT, OINK, TEXT_ONE, TEXT_TWO } from 'src/app/core/constants/constants';
import { ApiService } from 'src/app/core/services/api.service';
import { EncryptService } from 'src/app/core/services/encrypt.service';
import { FormService } from 'src/app/core/services/form.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
@Component({
  selector: 'app-paso-uno',
  templateUrl: './paso-uno.component.html',
  styleUrls: ['./paso-uno.component.scss']
})
export class PasoUnoComponent implements OnInit {

  @Output() paso = new EventEmitter<number>();
  public istex: boolean = true;
  public phoneNumber: string;
  public registerForm: FormGroup;
  public numberPad: any = [{number:'1'},{number:'2'},{number:'3'},{number:'4'},{number:'5'},
                   {number:'6'},{number:'7'},{number:'8'},{number:'9'}];
  public texts={ text:TEXT_ONE, text1:TEXT_TWO};  
  public imges = { oink:OINK,back:BACK,check:CHECK};               
  private error: any;
  private numbers: string = '';
  private codeEncrypt: string = '' ;
  public isKeyboardHide: boolean = true;

  constructor( 
    private api:ApiService, 
    private encrypt: EncryptService,
    private formBuilder: FormBuilder,
    public modalController: ModalController,
    public popoverController: PopoverController,
    private localStorage: LocalStorageService,
    private formService: FormService)
    {}

  ngOnInit(): void {
    this.buildForm()
  }

  private buildForm(): void {
    this.registerForm = this.formBuilder.group({
			phone_number: ['', [Validators.required, Validators.required, Validators.pattern(FIRST_NUMBER), Validators.maxLength(10)]],
      verification_id: ['']
		});
  }

  public validateinput(param: string): boolean {
    if (param.length > 0)
      return this.registerForm.get(param).invalid && this.registerForm.get(param).touched;
  }

  private encryptData(phone){
    return this.encrypt.encrypt(phone , KEY_ENCRYPT_DESENCRYPT);
  }
  
  private sendCode(phone:string) : void {
    this.api.sendVerificationNumber(this.encryptData(phone)).subscribe(resp=>{
      if(resp){
        this.istex = false;
        const respDecrypt =  this.encrypt.decrypt(resp.payload, KEY_ENCRYPT_DESENCRYPT);
        this.registerForm.controls.verification_id.reset()
        this.codeEncrypt = ''
        this.numbers = ''
      }
    }, (error: HttpErrorResponse) => {
			this.error = error.error.message;
			console.log(this.error);
		});
  }

  public getNumber(number:string): void {
    this.pruebaKey(number)
  }

  resetForms(){
    this.registerForm.get('verification_id').setValue('');
    this.numbers = '';
    this.codeEncrypt = '';
  }

  public pruebaKey(number?): void { 
    if(!this.istex){
      if(number !='')
        this.codeEncrypt = this.codeEncrypt + 'X';
      this.numbers = this.numbers + number;
      this.registerForm.get('verification_id').markAsTouched();
      this.registerForm.get('verification_id').setValue(this.codeEncrypt);
      this.validator();
      
    }else{
      this.numbers = this.numbers + number;
      this.registerForm.get('phone_number').markAsTouched();
      this.registerForm.get('phone_number').setValue(this.numbers);
    }
  }

  private validator(){    
    if(this.numbers.length == 4){
      if(this.numbers=='1234'){
        this.localStorage.create('DATA',{number_phone: this.phoneNumber})
          this.paso.emit(1)
      }          
      else
        this.createModal();
    }
  }

  public borrar() : void {
    if(!this.istex)
      this.codeEncrypt = this.codeEncrypt.slice(0,-1) 
    this.numbers = this.numbers.slice(0,-1);
    this.pruebaKey('')
  }

  public next(form) : void{
    if(form.valid && this.registerForm.get('phone_number').value.length==10 ){
      this.phoneNumber = form.value.phone_number
      const payload = this.createData(form.value.phone_number);
      this.numbers =''
      this.sendCode(payload)
    }
  }

  createData(phone_number){
    return `{"phone_number":"57${phone_number}","log_signup_id":""}`;
  }

  public async createModal(): Promise<void> {
    const popover: HTMLIonModalElement =
      await this.modalController.create({
        component: ModalComponent,
        cssClass: 'register-modal',
        componentProps: {
          header: 'CÓDIGO INCORRECTO',
          body: 'El código que ingresaste es incorrecto, enviaremos un nuevo código a tu correo electrónico.',
          footer: 'Reenviar código'
        }
      });
    await popover.present();
    const { data } = await popover.onDidDismiss();
    this.resetForms();
    if(data.data)
      this.sendCode(this.createData(this.phoneNumber));
  }

  public getErrorMessage(field: string): string {
    return this.formService.getErrorMessage(this.registerForm, field,'Ingrese un numero valido ej: 3155555555');
  }

  public checkErrors(field: string): boolean | undefined {
    return this.formService.checkErrors(this.registerForm, field);
  }
}
