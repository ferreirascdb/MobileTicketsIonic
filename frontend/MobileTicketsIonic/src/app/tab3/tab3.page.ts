import { Component, OnDestroy, OnInit } from '@angular/core';
import { Api, TicketPainel } from '../services/api';
@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit, OnDestroy {
  chamadas: TicketPainel[] = [];
  chamadaAtual: TicketPainel | null = null;

  carregando = false;
  erro = '';

  private intervaloAtualizacao: any;

  constructor(private api: Api) {}

  ngOnInit() {
    this.carregarPainel();

    this.intervaloAtualizacao = setInterval(() => {
      this.carregarPainel(false);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.intervaloAtualizacao) {
      clearInterval(this.intervaloAtualizacao);
    }
  }

  carregarPainel(mostrarLoading: boolean = true) {
    if (mostrarLoading) {
      this.carregando = true;
    }

    this.erro = '';

    this.api.buscarUltimasChamadas().subscribe({
      next: (resposta) => {
        this.chamadas = resposta.tickets || [];
        this.chamadaAtual = this.chamadas.length > 0 ? this.chamadas[0] : null;
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar painel:', erro);
        this.erro = 'Erro ao carregar painel.';
        this.carregando = false;
      },
    });
  }

  atualizarManual(event: any) {
    this.api.buscarUltimasChamadas().subscribe({
      next: (resposta) => {
        this.chamadas = resposta.tickets || [];
        this.chamadaAtual = this.chamadas.length > 0 ? this.chamadas[0] : null;
        event.target.complete();
      },
      error: (erro) => {
        console.error('Erro ao atualizar painel:', erro);
        this.erro = 'Erro ao atualizar painel.';
        event.target.complete();
      },
    });
  }

  obterNomeTipo(tipo: string): string {
    switch (tipo) {
      case 'SP':
        return 'Prioridade';
      case 'SG':
        return 'Geral';
      case 'SE':
        return 'Retirada de Exame';
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

  formatarHorario(data: string): string {
    if (!data) {
      return '';
    }

    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

}
