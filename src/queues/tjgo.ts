import fastq, { queueAsPromised } from "fastq";
import { workerPaginacao } from "@/pagination";

export type QueueTaskProcessos = {
  site: string;
  id: string;
  page: number;
  recaptcha: string;
};

export type QueueTaskPaginacao = {
  page: number;
  site: string;
  recaptcha: string;
  headers: string[], url: string
};


export const queuePaginacao: queueAsPromised<QueueTaskPaginacao> =
  fastq.promise(workerPaginacao, 20);

