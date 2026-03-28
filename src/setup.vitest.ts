import { TextDecoder, TextEncoder } from "node:util";
import "reflect-metadata";

Object.assign(global, { TextDecoder, TextEncoder });
