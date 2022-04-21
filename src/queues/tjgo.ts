import fastq, { queueAsPromised } from "fastq";
import { workerTJGO } from "@/lawsuit";
import { workerPaginacao } from "@/pagination";

export type QueueTaskProcessos = {
  site: string;
  id: string;
  page: number;
  recaptcha: string;
  cookie: any;
};

export type QueueTaskPaginacao = {
  page: number;
  site: string;
  recaptcha: string;
  cookie: any;
};

const CONCURRENCY = 20;

export const queuePaginacao: queueAsPromised<QueueTaskPaginacao> =
  fastq.promise(workerPaginacao, CONCURRENCY);

export const queueProcessos: queueAsPromised<QueueTaskProcessos> =
  fastq.promise(workerTJGO, CONCURRENCY);
