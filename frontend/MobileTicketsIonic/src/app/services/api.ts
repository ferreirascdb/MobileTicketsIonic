import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Ticket {
  id: number;
  numero:string;
  tipo: 'SP' | 'SG' | 'SE';
  sequencia: number;
    status: string;
    guiche_id?: number;
    data_emissao: string;
    data_chamada?: string;
    data_fim_atendimento?: string;
    tempo_atendimento_segundos?: number;
}
export interface Guiche {
  id: number;
  nome: string;
  ativo: number | boolean;
}
export interface TicketPainel {
  id: number;
  numero: string;
  tipo: 'SP' | 'SG' | 'SE';
  status: string;
  guiche_id: number;
  guiche_nome: string;
  data_chamada: string;
}
@Injectable({
  providedIn: 'root',
})
export class Api {
  private apiUrl = 'http://localhost:3000/api';
  constructor(private http: HttpClient) {}
  emititTicket(tipo: 'SP' | 'SG' | 'SE'): Observable<Ticket>{
    return this.http.post<Ticket>(`${this.apiUrl}/tickets`,{tipo});
  }
  listarGuiches(): Observable<Guiche[]> {
    return this.http.get<Guiche[]>(`${this.apiUrl}/guiches`);
  }

  chamarProximaSenha(guicheId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/guiches/${guicheId}/chamar-proxima`, {});
  }
  buscarSenhaAtualGuiche(guicheId: number) {
  return this.http.get<any>(`${this.apiUrl}/guiches/${guicheId}/senha-atual`);
  }

  finalizarAtendimento(ticketId: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/tickets/${ticketId}/finalizar`, {});
  }
  buscarUltimasChamadas(): Observable<{ tickets: TicketPainel[] }> {
    return this.http.get<{ tickets: TicketPainel[] }>(
      `${this.apiUrl}/painel/ultimas-chamadas`
    );
  }
  
}
