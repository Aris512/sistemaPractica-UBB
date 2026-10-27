import { useState, useEffect, useRef, useCallback } from "react";
import type React from "react";
import {
  Mic,
  Square,
  Trash2,
  Volume2,
  Sparkles,
  Loader2,
  FileText,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { sileo } from "sileo";
import type { NotaDeVozDTO } from "../../services/profesorEvaluacionApi";
import {
  getNotasDeVozPorEvaluacion,
  subirNotaDeVoz,
  eliminarNotaDeVoz,
  actualizarTranscripcionNotaVoz,
  getAudioUrl,
  transcribirAudioConIA,
} from "../../services/profesorEvaluacionApi";

// Declaración global para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceNoteRecorderProps {
  idEvaluacion?: number | null;
  rutGrabador?: string;
  nombreGrabador?: string;
  onInsertTranscription?: (text: string) => void;
  onVoiceNoteCreated?: (nota: NotaDeVozDTO) => void;
  readOnly?: boolean;
  defaultCollapsed?: boolean;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  idEvaluacion,
  rutGrabador,
  nombreGrabador,
  onInsertTranscription,
  onVoiceNoteCreated,
  readOnly = false,
  defaultCollapsed = false,
}) => {
  // Estado para colapsar/expandir el panel
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);

  // Lista de notas existentes cargadas desde el backend
  const [notasList, setNotasList] = useState<NotaDeVozDTO[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);

  // Estados de grabación
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrlPreview, setAudioUrlPreview] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isListeningSpeech, setIsListeningSpeech] = useState<boolean>(false);
  const [speechSupported] = useState<boolean>(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isTranscribingIA, setIsTranscribingIA] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  // Edición de transcripción en notas guardadas
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");

  // Refs de audio, transcripción y MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const accumulatedFinalRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);


  // Limpiar timer y tracks al desmontar
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Solo las notas de la evaluación de quien abre el modal: las de otros evaluadores
  // (tutor, colaborador, profesor) no se mezclan ni se pueden borrar desde aquí.
  const cargarNotasDeVoz = useCallback(async () => {
    if (!idEvaluacion) {
      setNotasList([]);
      return;
    }
    setLoadingList(true);
    try {
      const notas = await getNotasDeVozPorEvaluacion(idEvaluacion);
      setNotasList(notas || []);
    } catch (err) {
      console.error("Error al cargar notas de voz:", err);
    } finally {
      setLoadingList(false);
    }
  }, [idEvaluacion]);

  useEffect(() => {
    void cargarNotasDeVoz();
  }, [cargarNotasDeVoz]);

  const puedeModificar = (nota: NotaDeVozDTO) =>
    !readOnly &&
    !!rutGrabador &&
    (!nota.rutGrabador || nota.rutGrabador.toLowerCase() === rutGrabador.toLowerCase());

  // Transcribir audio grabado con IA (Groq Whisper)
  const handleTranscribirConIA = async (blobToUse?: Blob) => {
    const targetBlob = blobToUse || audioBlob;
    if (!targetBlob) return;
    setIsTranscribingIA(true);
    setErrorMsg(null);
    try {
      const texto = await transcribirAudioConIA(targetBlob);
      if (texto && texto.trim()) {
        setTranscription(texto.trim());
        accumulatedFinalRef.current = texto.trim();
        sileo.success({
          title: "Transcripción con IA (Whisper) lista",
          description: "Se convirtió el audio en texto con éxito.",
        });
      } else {
        sileo.info({
          title: "Audio procesado",
          description: "La IA no detectó palabras audibles en la grabación.",
        });
      }
    } catch (err: any) {
      console.warn("Fallo al transcribir con IA:", err);
      const msg = err.message?.includes("GROQ_API_KEY")
        ? "El servidor no tiene configurada la clave GROQ_API_KEY en .env. Puedes escribir la observación manualmente o configurar la clave en el servidor."
        : (err.message || "No se pudo transcribir el audio con IA.");
      setErrorMsg(msg);
      sileo.error({
        title: "Transcripción IA no disponible",
        description: msg,
      });
    } finally {
      setIsTranscribingIA(false);
    }
  };

  // Iniciar grabación
  const handleStartRecording = async () => {
    setErrorMsg(null);
    setAudioBlob(null);
    if (audioUrlPreview) {
      URL.revokeObjectURL(audioUrlPreview);
      setAudioUrlPreview(null);
    }
    setTranscription("");
    setInterimTranscript("");
    accumulatedFinalRef.current = "";
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    isRecordingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Configurar MediaRecorder
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrlPreview(url);
        stream.getTracks().forEach((track) => track.stop());

        // Si la transcripción en vivo del navegador no capturó texto, autotranscribir con IA Whisper
        if (!accumulatedFinalRef.current.trim()) {
          handleTranscribirConIA(fullBlob);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      // Iniciar temporizador
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Iniciar reconocimiento de voz con Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "es-CL";

          recognition.onstart = () => {
            setIsListeningSpeech(true);
          };

          recognition.onresult = (event: any) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              const text = res[0].transcript;
              if (res.isFinal) {
                accumulatedFinalRef.current += (accumulatedFinalRef.current ? " " : "") + text.trim();
              } else {
                interim += text;
              }
            }
            const fullText = (accumulatedFinalRef.current + (interim ? " " + interim : "")).trim();
            setTranscription(fullText);
            setInterimTranscript(interim);
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition notice:", event.error);
            if (event.error === "no-speech") return;
            if (event.error === "network") {
              setErrorMsg(
                "Aviso: La transcripción en vivo del navegador no respondió. Se utilizará Whisper IA al terminar de grabar."
              );
            }
          };

          recognition.onend = () => {
            setIsListeningSpeech(false);
          };

          // Pequeño retardo para no colisionar con el stream de audio
          setTimeout(() => {
            if (isRecordingRef.current) {
              try {
                recognition.start();
                recognitionRef.current = recognition;
              } catch (e) {
                console.warn("No se pudo iniciar SpeechRecognition:", e);
              }
            }
          }, 150);
        } catch (e) {
          console.warn("Error al inicializar SpeechRecognition:", e);
        }
      }
    } catch (err: any) {
      console.error("Error al acceder al micrófono:", err);
      setIsRecording(false);
      isRecordingRef.current = false;
      setErrorMsg("No se pudo acceder al micrófono. Por favor verifica los permisos en tu navegador.");
    }
  };

  // Detener grabación
  const handleStopRecording = () => {
    isRecordingRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    setIsRecording(false);
    setIsListeningSpeech(false);

    // Si había texto provisional, consolidarlo en la transcripción final
    if (interimTranscript) {
      setTranscription((prev) => {
        const merged = (prev + " " + interimTranscript).replace(/\s+/g, " ").trim();
        return merged;
      });
      setInterimTranscript("");
    }
  };

  // Cancelar grabación actual
  const handleCancelCurrent = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setAudioBlob(null);
    if (audioUrlPreview) {
      URL.revokeObjectURL(audioUrlPreview);
      setAudioUrlPreview(null);
    }
    setTranscription("");
    setInterimTranscript("");
    accumulatedFinalRef.current = "";
    setRecordingSeconds(0);
    setErrorMsg(null);
  };

  // Subir nota de voz al backend
  const handleSaveVoiceNote = async () => {
    if (!audioBlob) {
      setErrorMsg("No hay ningún audio grabado para guardar.");
      return;
    }
    if (!idEvaluacion) {
      setErrorMsg("Guarda la evaluación antes de adjuntar notas de voz. Puedes insertar la transcripción en las observaciones.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([audioBlob], `nota_voz_${Date.now()}.${extension}`, {
        type: audioBlob.type,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("idEvaluacion", String(idEvaluacion));
      formData.append("duracion", String(recordingSeconds));
      formData.append("transcripcion", transcription.trim());
      if (rutGrabador) {
        formData.append("rutGrabador", rutGrabador);
      }
      if (nombreGrabador) {
        formData.append("nombreGrabador", nombreGrabador);
      }

      const nuevaNota = await subirNotaDeVoz(formData);
      setNotasList((prev) => [nuevaNota, ...prev]);

      if (onVoiceNoteCreated) {
        onVoiceNoteCreated(nuevaNota);
      }

      handleCancelCurrent();
    } catch (err: any) {
      console.error("Error al subir nota de voz:", err);
      setErrorMsg(err.message || "Error al subir la nota de voz.");
    } finally {
      setIsUploading(false);
    }
  };

  // Eliminar nota de voz
  const handleDeleteNote = async (idAudio: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta nota de voz?")) return;
    try {
      await eliminarNotaDeVoz(idAudio, rutGrabador ?? "");
      setNotasList((prev) => prev.filter((n) => n.idAudio !== idAudio));
    } catch (err: any) {
      alert("Error al eliminar la nota de voz: " + err.message);
    }
  };

  // Guardar edición de transcripción
  const handleSaveEditTranscription = async (idAudio: number) => {
    try {
      const updated = await actualizarTranscripcionNotaVoz(idAudio, editText, rutGrabador ?? "");
      setNotasList((prev) => prev.map((n) => (n.idAudio === idAudio ? updated : n)));
      setEditingId(null);
    } catch (err: any) {
      alert("Error al actualizar la transcripción: " + err.message);
    }
  };

  // Copiar transcripción al portapapeles
  const handleCopyText = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Formato mm:ss
  const formatSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50/30 text-xs transition-all shadow-2xs overflow-hidden">
      {/* Barra superior compacta con botón de colapsar / expandir */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-sky-50 to-white border-b border-sky-100">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-600 text-white shadow-2xs">
            <Mic className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-950 text-xs">
              Notas de Voz & Transcripción
            </span>
            <span className="rounded-full bg-sky-100 px-2 py-0.2 text-[10px] font-semibold text-sky-800">
              {notasList.length} {notasList.length === 1 ? "grabación" : "grabaciones"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarNotasDeVoz}
            disabled={loadingList}
            className="text-slate-400 hover:text-sky-700 p-1 rounded transition-colors"
            title="Actualizar notas"
          >
            <RefreshCw className={`h-3 w-3 ${loadingList ? "animate-spin text-sky-600" : ""}`} />
          </button>

          {/* Botón para mostrar o ocultar el panel */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-sky-50 text-[11px] font-medium text-sky-800 border border-sky-200 shadow-2xs transition-all cursor-pointer"
            title={isCollapsed ? "Mostrar panel de notas de voz" : "Ocultar panel de notas de voz"}
          >
            <span>{isCollapsed ? "Mostrar" : "Ocultar"}</span>
            {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Contenido cuando el panel NO está colapsado */}
      {!isCollapsed && (
        <div className="p-3 space-y-3 animate-in fade-in duration-150">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-[11px] text-rose-700 border border-rose-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!speechSupported && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800 border border-amber-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>
                Reconocimiento de voz automático no soportado en este navegador; puedes grabar y reproducir audio, y escribir tu texto en la caja.
              </span>
            </div>
          )}

          {/* Controles de Grabación si no está en modo sólo lectura */}
          {!readOnly && (
            <div className="rounded-lg border border-white bg-white p-2.5 shadow-2xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Grabar Voz
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-900 active:scale-95 transition-all"
                    >
                      <Square className="h-3.5 w-3.5 fill-white" />
                      Detener
                    </button>
                  )}

                  {isRecording && (
                    <div className="flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 border border-rose-200 text-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                      </span>
                      <span className="font-mono font-bold text-rose-700">
                        {formatSeconds(recordingSeconds)}
                      </span>
                      {isListeningSpeech && (
                        <span className="text-[10px] text-rose-500 font-medium ml-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 animate-spin" />
                          Escuchando...
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {audioBlob && !isRecording && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCancelCurrent}
                      disabled={isUploading}
                      className="text-[11px] text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors"
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveVoiceNote}
                      disabled={isUploading || !idEvaluacion}
                      title={idEvaluacion ? undefined : "Guarda la evaluación antes de adjuntar notas de voz"}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-3 w-3" />
                          Adjuntar Nota
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Vista previa de audio grabado */}
              {audioUrlPreview && !isRecording && (
                <div className="space-y-2">
                  <div className="rounded-md bg-slate-50 p-2 border border-slate-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Volume2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <audio controls src={audioUrlPreview} className="h-7 w-full" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTranscribirConIA()}
                      disabled={isTranscribingIA || isUploading}
                      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-sky-800 bg-sky-100/80 hover:bg-sky-200/80 border border-sky-300 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      title="Transcribir este audio a texto con IA Whisper"
                    >
                      {isTranscribingIA ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-sky-700" />
                          <span>Transcribiendo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 text-sky-600" />
                          <span>{transcription ? "Re-transcribir con IA" : "Transcribir con IA (Whisper)"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Caja de transcripción */}
              {(isRecording || transcription || interimTranscript || isTranscribingIA) && (
                <div className="rounded-md border border-sky-200 bg-sky-50/40 p-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-sky-900 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-sky-600" />
                      Transcripción del Audio:
                    </span>
                    <div className="flex items-center gap-1">
                      {transcription && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(transcription, "preview")}
                          className="text-[10px] text-sky-700 hover:text-sky-900 px-1.5 py-0.5 rounded bg-white border border-sky-200 shadow-2xs cursor-pointer"
                        >
                          {copiedId === "preview" ? "Copiado" : "Copiar"}
                        </button>
                      )}
                      {onInsertTranscription && (transcription || interimTranscript) && (
                        <button
                          type="button"
                          onClick={() => onInsertTranscription(transcription || interimTranscript)}
                          className="text-[10px] font-semibold text-sky-800 hover:bg-sky-100 px-1.5 py-0.5 rounded border border-sky-300 cursor-pointer"
                        >
                          Insertar en Observaciones
                        </button>
                      )}
                    </div>
                  </div>

                  {isTranscribingIA ? (
                    <div className="flex items-center gap-2 p-2 bg-white rounded border border-sky-200 text-xs text-sky-700">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600 shrink-0" />
                      <span>Procesando audio con IA (Groq Whisper)... Generando texto.</span>
                    </div>
                  ) : isRecording ? (
                    <div className="text-xs text-slate-700 bg-white p-2 rounded border border-sky-100 min-h-[40px] whitespace-pre-wrap leading-relaxed">
                      <span>{transcription}</span>
                      <span className="italic text-sky-600 font-medium"> {interimTranscript}</span>
                      {!transcription && !interimTranscript && (
                        <span className="text-slate-400 italic">Habla al micrófono... tus palabras aparecerán aquí o se transcribirán con Whisper al detener.</span>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      placeholder="Edita o complementa la transcripción de tu audio aquí antes de adjuntarlo..."
                      rows={2}
                      className="w-full text-xs text-slate-800 bg-white p-2 rounded border border-sky-200 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed resize-y"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lista de grabaciones existentes */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 block">
              Grabaciones registradas ({notasList.length})
            </span>

            {notasList.length === 0 && !loadingList && (
              <p className="text-[11px] text-slate-400 italic p-2 rounded bg-white/70 border border-dashed border-slate-200 text-center">
                {readOnly
                  ? "No hay notas de voz registradas para este estudiante."
                  : "No hay notas de voz registradas todavía. Graba una usando el botón arriba."}
              </p>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notasList.map((nota, idx) => (
                <div
                  key={nota.idAudio}
                  className="rounded-lg border border-slate-200 bg-white p-2 shadow-2xs space-y-1.5 hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded text-[10px]">
                        #{notasList.length - idx}
                      </span>
                      <span className="text-slate-500">
                        {nota.fechaGrabacion ? new Date(nota.fechaGrabacion).toLocaleString("es-CL") : "Fecha no disp."}
                      </span>
                      {(nota.nombreGrabador || nota.rutGrabador) && (
                        <span className="text-[10px] text-slate-600 font-medium">
                          • Por: {nota.nombreGrabador || nota.rutGrabador}
                        </span>
                      )}
                    </div>

                    {puedeModificar(nota) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(nota.idAudio)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        title="Eliminar grabación"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Reproductor de audio */}
                  <audio
                    controls
                    src={getAudioUrl(nota.idAudio)}
                    preload="metadata"
                    className="h-6 w-full"
                  />

                  {/* Transcripción asociada */}
                  {editingId === nota.idAudio ? (
                    <div className="space-y-1 pt-1">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="w-full text-[11px] text-slate-800 bg-sky-50/50 p-1.5 rounded border border-sky-300 focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-0.5 text-[10px] text-slate-600"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditTranscription(nota.idAudio)}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-sky-600 text-white rounded"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded bg-sky-50/50 p-1.5 border border-sky-100 text-[11px] text-slate-700">
                      <div className="flex items-center justify-between text-[10px] text-sky-800 font-medium mb-0.5">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-sky-600" />
                          Transcripción:
                        </span>
                        <div className="flex items-center gap-1">
                          {nota.transcripcion && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(nota.transcripcion!, nota.idAudio)}
                              className="text-[10px] text-sky-700 hover:text-sky-900"
                            >
                              {copiedId === nota.idAudio ? "Copiado" : "Copiar"}
                            </button>
                          )}
                          {onInsertTranscription && nota.transcripcion && !readOnly && (
                            <button
                              type="button"
                              onClick={() => onInsertTranscription(nota.transcripcion!)}
                              className="text-[10px] font-bold text-sky-800 hover:underline"
                            >
                              Insertar en Obs.
                            </button>
                          )}
                          {puedeModificar(nota) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(nota.idAudio);
                                setEditText(nota.transcripcion || "");
                              }}
                              className="text-[10px] text-slate-400 hover:text-sky-700"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="italic text-slate-600 leading-relaxed text-[11px]">
                        {nota.transcripcion ? `"${nota.transcripcion}"` : "(Sin transcripción disponible)"}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
