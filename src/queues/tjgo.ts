import fastq, { queueAsPromised } from "fastq";
import { workerHTML, workerTJGO } from "@/lawsuit";
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
};

export const queuePaginacao: queueAsPromised<QueueTaskPaginacao> =
  fastq.promise(workerPaginacao, 20);

export const queueProcessos: queueAsPromised<QueueTaskProcessos> =
  fastq.promise(workerTJGO, 20);

export const queueProcessosHTML: queueAsPromised =
  fastq.promise(workerHTML, 1);
