import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Api, Guiche, Ticket } from '../services/api';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  guiches: Guiche[] = [];
  guicheSelecionadoId?: number;
  ticketAtual?: Ticket;

  constructor(
    private apiService: Api,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.carregarGuiches();
  }

  carregarGuiches() {
    this.apiService.listarGuiches().subscribe({
      next: (guiches) => {
        this.guiches = guiches;
      },
      error: async (error) => {
        console.error(error);

        const toast = await this.toastController.create({
          message: 'Erro ao carregar guichês.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });

        await toast.present();
      }
    });
  }

  async selecionarGuiche(guicheOuId: Guiche | number) {
    const guicheId = typeof guicheOuId === 'number'
      ? guicheOuId
      : guicheOuId?.id;

    if (!guicheId) {
      this.guicheSelecionadoId = undefined;
      this.ticketAtual = undefined;
      return;
    }

    this.guicheSelecionadoId = guicheId;
    this.ticketAtual = undefined;

    const loading = await this.loadingController.create({
      message: 'Verificando senha atual...'
    });

    await loading.present();

    this.apiService.buscarSenhaAtualGuiche(guicheId).subscribe({
      next: async (resposta) => {
        await loading.dismiss();

        this.ticketAtual = resposta?.ticket || undefined;
      },
      error: async (error) => {
        await loading.dismiss();

        console.error('Erro ao buscar senha atual:', error);

        this.ticketAtual = undefined;

        const mensagem = error.error?.erro || error.error?.mensagem || 'Erro ao buscar senha atual do guichê.';

        const toast = await this.toastController.create({
          message: mensagem,
          duration: 3000,
          color: 'danger',
          position: 'top'
        });

        await toast.present();
      }
    });
  }

  async chamarProximaSenha() {
    if (!this.guicheSelecionadoId) {
      const toast = await this.toastController.create({
        message: 'Selecione um guichê antes de chamar a próxima senha.',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });

      await toast.present();
      return;
    }

    if (this.ticketAtual) {
      const toast = await this.toastController.create({
        message: `Já existe uma senha em atendimento neste guichê: ${this.ticketAtual.numero}.`,
        duration: 3000,
        color: 'warning',
        position: 'top'
      });

      await toast.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Chamando próxima senha...'
    });

    await loading.present();

    this.apiService.chamarProximaSenha(this.guicheSelecionadoId).subscribe({
      next: async (resposta) => {
        await loading.dismiss();

        const ticket = resposta?.ticket;

        if (!ticket || !ticket.id) {
          const toast = await this.toastController.create({
            message: resposta?.mensagem || 'Nenhuma senha aguardando atendimento.',
            duration: 3000,
            color: 'warning',
            position: 'top'
          });

          await toast.present();
          return;
        }

        this.ticketAtual = ticket;

        const alert = await this.alertController.create({
          header: 'Senha chamada',
          message: `Senha ${ticket.numero} chamada com sucesso.`,
          buttons: ['OK']
        });

        await alert.present();
      },
      error: async (error) => {
        await loading.dismiss();

        console.error(error);

        if (error.status === 409 && error.error?.ticket) {
          this.ticketAtual = error.error.ticket;

          const toast = await this.toastController.create({
            message: `Este guichê já possui uma senha em atendimento: ${this.ticketAtual?.numero}.`,
            duration: 3000,
            color: 'warning',
            position: 'top'
          });

          await toast.present();
          return;
        }

        const mensagem = error.error?.erro || error.error?.mensagem || 'Erro ao chamar próxima senha.';

        const toast = await this.toastController.create({
          message: mensagem,
          duration: 3000,
          color: 'danger',
          position: 'top'
        });

        await toast.present();
      }
    });
  }

  async finalizarAtendimento() {
    if (!this.ticketAtual) {
      const toast = await this.toastController.create({
        message: 'Nenhuma senha em atendimento para finalizar.',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });

      await toast.present();
      return;
    }

    const alertConfirmacao = await this.alertController.create({
      header: 'Finalizar atendimento',
      message: `Deseja finalizar o atendimento da senha ${this.ticketAtual.numero}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Finalizar',
          handler: async () => {
            await this.confirmarFinalizacao();
          }
        }
      ]
    });

    await alertConfirmacao.present();
  }

  private async confirmarFinalizacao() {
    if (!this.ticketAtual) {
      return;
    }

    const ticketId = this.ticketAtual.id;

    const loading = await this.loadingController.create({
      message: 'Finalizando atendimento...'
    });

    await loading.present();

    this.apiService.finalizarAtendimento(ticketId).subscribe({
      next: async () => {
        await loading.dismiss();

        const toast = await this.toastController.create({
          message: 'Atendimento finalizado com sucesso.',
          duration: 3000,
          color: 'success',
          position: 'top'
        });

        await toast.present();

        this.ticketAtual = undefined;
      },
      error: async (error) => {
        await loading.dismiss();

        console.error(error);

        const mensagem = error.error?.erro || error.error?.mensagem || 'Erro ao finalizar atendimento.';

        const toast = await this.toastController.create({
          message: mensagem,
          duration: 3000,
          color: 'danger',
          position: 'top'
        });

        await toast.present();
      }
    });
  }

  obterNomeTipo(tipo: string): string {
    switch (tipo) {
      case 'SP':
        return 'Prioritária';
      case 'SG':
        return 'Geral';
      case 'SE':
        return 'Retirada de Exames';
      default:
        return tipo;
    }
  }

  obterCorTipo(tipo: string): string {
    switch (tipo) {
      case 'SP':
        return 'danger';
      case 'SG':
        return 'primary';
      case 'SE':
        return 'success';
      default:
        return 'medium';
    }
  }
}
