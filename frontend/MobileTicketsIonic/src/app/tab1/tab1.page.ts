import { Component } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Api, Ticket } from '../services/api';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {

  ultimoTicket?:Ticket;

  constructor(
    private api: Api,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async emitirSenha(tipo: 'SP' | 'SG' | 'SE'){
    const loading = await this.loadingController.create({
      message: 'Emitindo senha.'
    });
    await loading.present();
    this.api.emititTicket(tipo).subscribe({
      next: async (ticket) => {
        await loading.dismiss();
        this.ultimoTicket = ticket;

        const alert = await this.alertController.create({
          header: 'Senha emitida',
          message: `Sua senha é: ${ticket.numero}`,
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (error) => {
        await loading.dismiss();
        console.error(error);
        const mensagem = error.error?.erro || 'Erro ao emitir senha';
        const toast = await this.toastController.create({
          message: mensagem,
          duration: 3000,
          color: 'danger', 
          position: 'top'
        });
        await toast.present();
      }
    })
  }

}
