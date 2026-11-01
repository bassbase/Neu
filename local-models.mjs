export function createLocalModels(base = 'http://127.0.0.1:11434') {
  const url = new URL(base);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Lokale KI muss auf Loopback laufen.');
  const fail = message => Object.assign(new Error(message), { status: 409 });
  async function models() {
    try {
      const response = await fetch(base + '/api/tags', { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw Error();
      const data = await response.json();
      return (data.models ?? []).filter(m => typeof m.name === 'string' && m.name.length <= 200 && !/cloud/i.test(m.name) && !m.remote_host && !m.remote_model).map(m => ({ id: m.name, name: m.name }));
    } catch { throw fail('Ollama ist nicht bereit. Einmal Lokal-einrichten.cmd starten und ein lokales Modell herunterladen. Es wird nicht auf einen externen Anbieter ausgewichen.'); }
  }
  return {
    models,
    async select(requested, hasImages) {
      const available = await models();
      const name = requested === 'auto' ? available[0]?.id : available.find(m => m.id === requested)?.id;
      if (!name) throw fail('Kein heruntergeladenes lokales Modell verfuegbar. Bitte Lokal-einrichten.cmd ausfuehren.');
      const response = await fetch(base + '/api/show', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: name }), signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw fail('Das lokale Modell kann nicht geprueft werden. Kein externer Ersatzaufruf erfolgt.');
      const info = await response.json();
      if (info.remote_host || info.remote_model || !info.model_info || !Object.keys(info.model_info).length || !['gguf', 'safetensors'].includes(info.details?.format) || /^FROM\s+https?:/mi.test(info.modelfile ?? '')) throw fail('Dieses Modell ist nicht als heruntergeladenes lokales Modell bestaetigt. Cloud-Modelle und unklare Aliase sind im lokalen Modus gesperrt.');
      if (hasImages && !info.capabilities?.includes('vision')) throw fail('Dieses lokale Modell kann keine Bilder lesen. Bitte ein lokal installiertes Vision-Modell waehlen.');
      return name;
    },
    endpoint: base + '/v1/chat/completions',
  };
}
