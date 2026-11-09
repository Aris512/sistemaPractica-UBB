package com.backend.service;

/** Mensaje en formato de chat completions (OpenAI): role es "system", "user" o "assistant". */
public record MensajeIA(String role, String content) {
}
