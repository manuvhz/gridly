import { AnimatePresence, motion } from "framer-motion";
import {
  Antenna,
  BadgeCheck,
  BookOpenText,
  Brain,
  CheckCircle2,
  Cpu,
  GraduationCap,
  MapPin,
  RadioTower,
  Rocket,
  Router,
  ScanLine,
  ShieldCheck,
  SignalHigh,
  Smartphone,
  Sparkles,
  TabletSmartphone,
  Wifi,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

const zones = [
  { id: "aula", label: "Aula 203", x: 18, y: 28, need: 72 },
  { id: "lab", label: "Lab redes", x: 42, y: 62, need: 88 },
  { id: "biblioteca", label: "Biblioteca", x: 74, y: 24, need: 66 },
  { id: "patio", label: "Patio", x: 78, y: 72, need: 58 },
];

const quiz = [
  {
    question: "Si hay muchos usuarios en un aula, la mejora más fuerte suele ser:",
    options: ["Usar Wi-Fi 6", "Bajar la seguridad", "Usar la misma clave para todo"],
    answer: "Usar Wi-Fi 6",
  },
  {
    question: "Para invitados en una red universitaria conviene:",
    options: ["Separar VLAN o red de invitados", "Dar acceso al router", "Desactivar cifrado"],
    answer: "Separar VLAN o red de invitados",
  },
  {
    question: "Cuando un móvil cambia de antena sin cortar la sesión ocurre:",
    options: ["Roaming", "Formateo", "Broadcast infinito"],
    answer: "Roaming",
  },
];

const securityOptions = [
  { id: "open", label: "Abierta", score: 18 },
  { id: "wpa2", label: "WPA2", score: 72 },
  { id: "wpa3", label: "WPA3", score: 96 },
];

const channelOptions = [
  { id: "1", label: "Canal 1", noise: 40 },
  { id: "6", label: "Canal 6", noise: 18 },
  { id: "11", label: "Canal 11", noise: 28 },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function App() {
  const [apCount, setApCount] = useState(2);
  const [power, setPower] = useState(68);
  const [users, setUsers] = useState(42);
  const [channel, setChannel] = useState(channelOptions[1]);
  const [security, setSecurity] = useState(securityOptions[2]);
  const [selectedZone, setSelectedZone] = useState(zones[0]);
  const [packetRuns, setPacketRuns] = useState(0);
  const [roamingStep, setRoamingStep] = useState(1);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  const network = useMemo(() => {
    const coverage = clamp(Math.round(apCount * 22 + power * 0.48 - channel.noise * 0.34), 12, 100);
    const capacity = clamp(Math.round(112 - users * 0.68 + apCount * 10), 16, 100);
    const reliability = clamp(Math.round((coverage + capacity + security.score) / 3 - channel.noise * 0.08), 8, 100);
    const latency = clamp(Math.round(8 + users * 0.24 + channel.noise * 0.2 - apCount * 1.8), 5, 90);
    return { coverage, capacity, reliability, latency };
  }, [apCount, power, users, channel, security]);

  const zoneQuality = clamp(
    Math.round(network.coverage * 0.58 + network.capacity * 0.24 + security.score * 0.18 - selectedZone.need * 0.18),
    4,
    100
  );
  const verdict =
    zoneQuality >= 82
      ? "Excelente: la zona queda lista para clase, video y prácticas."
      : zoneQuality >= 62
        ? "Aceptable: funciona, pero conviene ajustar potencia o AP."
        : "Critico: hay riesgo de cortes y baja velocidad.";

  const packetStatus =
    packetRuns === 0
      ? "Presiona enviar paquete para ver el recorrido."
      : network.reliability > 68
        ? "Paquete entregado con respuesta estable."
        : "Paquete entregado con retraso: revisa ruido y capacidad.";

  const chooseAnswer = (option) => {
    if (locked) return;
    if (option === quiz[quizIndex].answer) setScore((value) => value + 1);
    setLocked(true);
    window.setTimeout(() => {
      setQuizIndex((value) => (value + 1) % quiz.length);
      setLocked(false);
    }, 260);
  };

  return (
    <main className="expo-page">
      <section className="cover">
        <div className="cover-copy">
          <span className="tag">
            <Sparkles size={16} />
            Universidad de Córdoba · Andrés Buelvas · VI semestre
          </span>
          <h1>Laboratorio de redes inalámbricas y móviles</h1>
          <p>
            Diseña una red para un campus: ajusta puntos de acceso, potencia, canal, seguridad y usuarios. La página
            calcula cobertura, capacidad, latencia, roaming y entrega de paquetes en vivo.
          </p>
        </div>

        <MissionMap
          apCount={apCount}
          packetRuns={packetRuns}
          power={power}
          roamingStep={roamingStep}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          zoneQuality={zoneQuality}
        />
      </section>

      <section className="control-studio" aria-label="Controles del laboratorio">
        <article className="control-panel">
          <PanelHeading icon={Router} eyebrow="Constructor" title="Configura la red" />
          <div className="stepper-row">
            <button data-testid="ap-minus" onClick={() => setApCount((value) => clamp(value - 1, 1, 4))}>
              -
            </button>
            <div>
              <span>Puntos de acceso</span>
              <strong data-testid="ap-count">{apCount}</strong>
            </div>
            <button data-testid="ap-plus" onClick={() => setApCount((value) => clamp(value + 1, 1, 4))}>
              +
            </button>
          </div>

          <RangeControl id="power" label="Potencia de señal" value={power} min={25} max={100} onChange={setPower} />
          <RangeControl id="users" label="Usuarios conectados" value={users} min={10} max={95} onChange={setUsers} />

          <div className="segmented-group">
            <span>Canal Wi-Fi</span>
            <div>
              {channelOptions.map((item) => (
                <button
                  key={item.id}
                  data-testid={`channel-${item.id}`}
                  className={channel.id === item.id ? "active" : ""}
                  onClick={() => setChannel(item)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="segmented-group">
            <span>Seguridad</span>
            <div>
              {securityOptions.map((item) => (
                <button
                  key={item.id}
                  data-testid={`security-${item.id}`}
                  className={security.id === item.id ? "active" : ""}
                  onClick={() => setSecurity(item)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="metrics-panel">
          <PanelHeading icon={ScanLine} eyebrow="Lectura en vivo" title="Estado de la red" />
          <div className="meter-grid">
            <Meter icon={SignalHigh} label="Cobertura" value={network.coverage} suffix="%" />
            <Meter icon={Cpu} label="Capacidad" value={network.capacity} suffix="%" />
            <Meter icon={ShieldCheck} label="Confianza" value={network.reliability} suffix="%" />
            <Meter icon={Zap} label="Latencia" value={network.latency} suffix=" ms" reverse />
          </div>
          <div className="zone-readout">
            <span>{selectedZone.label}</span>
            <strong data-testid="zone-quality">{zoneQuality}%</strong>
            <p>{verdict}</p>
          </div>
        </article>
      </section>

      <section className="activity-grid">
        <article className="packet-lab">
          <PanelHeading icon={Rocket} eyebrow="Mini simulación" title="Enviar paquete" />
          <div className={`packet-track run-${packetRuns % 4}`}>
            <span>Cliente</span>
            <i key={packetRuns} />
            <span>AP</span>
            <span>Servidor</span>
          </div>
          <button className="action-button" data-testid="packet-button" onClick={() => setPacketRuns((value) => value + 1)}>
            Enviar paquete
          </button>
          <p data-testid="packet-status">{packetStatus}</p>
        </article>

        <article className="roaming-lab">
          <PanelHeading icon={Smartphone} eyebrow="Movilidad" title="Roaming entre celdas" />
          <div className="roaming-stage" style={{ "--step": `${roamingStep * 25}%` }}>
            <span>Celda A</span>
            <span>Celda B</span>
            <strong>
              <TabletSmartphone size={22} />
            </strong>
          </div>
          <div className="roaming-actions">
            {[0, 1, 2, 3].map((step) => (
              <button
                key={step}
                data-testid={`roaming-${step}`}
                className={roamingStep === step ? "active" : ""}
                onClick={() => setRoamingStep(step)}
              >
                {step + 1}
              </button>
            ))}
          </div>
          <p>{roamingStep < 2 ? "El móvil permanece asociado a Celda A." : "Handoff activo: el móvil pasa a Celda B."}</p>
        </article>

        <article className="quiz-lab">
          <PanelHeading icon={Brain} eyebrow="Reto" title="Pregunta rápida" />
          <AnimatePresence mode="wait">
            <motion.div
              key={quizIndex}
              className="quiz-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
            >
              <p>{quiz[quizIndex].question}</p>
              {quiz[quizIndex].options.map((option) => (
                <button key={option} disabled={locked} onClick={() => chooseAnswer(option)}>
                  {option}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
          <strong className="score-pill" data-testid="quiz-score">
            <BadgeCheck size={17} />
            {score}/{quiz.length} aciertos
          </strong>
        </article>
      </section>

      <footer className="final-note">
        <GraduationCap size={28} />
        <div>
          <strong>Resumen del módulo</strong>
          <p>
            Una red inalámbrica profesional se diseña equilibrando cobertura, capacidad, seguridad, canalización y
            movilidad. Si una variable falla, toda la experiencia del usuario se siente lenta o inestable.
          </p>
        </div>
        <BookOpenText size={28} />
      </footer>
    </main>
  );
}

function MissionMap({ apCount, packetRuns, power, roamingStep, selectedZone, setSelectedZone, zoneQuality }) {
  const apPositions = [
    { x: 34, y: 42 },
    { x: 61, y: 48 },
    { x: 48, y: 25 },
    { x: 52, y: 72 },
  ].slice(0, apCount);

  return (
    <div className="mission-map" style={{ "--power": `${power}%`, "--quality": `${zoneQuality}%`, "--roam": `${roamingStep * 25}%` }}>
      <div className="map-lines" />
      {zones.map((zone) => (
        <button
          key={zone.id}
          data-testid={`zone-${zone.id}`}
          className={`zone ${selectedZone.id === zone.id ? "selected" : ""}`}
          style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
          onClick={() => setSelectedZone(zone)}
        >
          <MapPin size={15} />
          {zone.label}
        </button>
      ))}
      {apPositions.map((position, index) => (
        <span className="access-point" key={`${position.x}-${position.y}`} style={{ left: `${position.x}%`, top: `${position.y}%` }}>
          <Wifi size={20} />
          AP {index + 1}
        </span>
      ))}
      <span className="moving-device">
        <Smartphone size={21} />
      </span>
      <span className="packet-flash" key={packetRuns} />
      <div className="quality-badge">
        <Antenna size={20} />
        <span>Calidad zona</span>
        <strong>{zoneQuality}%</strong>
      </div>
    </div>
  );
}

function RangeControl({ id, label, value, min, max, onChange }) {
  const update = (event) => onChange(Number(event.currentTarget.value));
  return (
    <label className="range-control" htmlFor={id}>
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <input
        id={id}
        data-testid={`${id}-slider`}
        min={min}
        max={max}
        onChange={update}
        onInput={update}
        type="range"
        value={value}
      />
    </label>
  );
}

function PanelHeading({ icon: Icon, eyebrow, title }) {
  return (
    <div className="panel-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <Icon size={24} />
    </div>
  );
}

function Meter({ icon: Icon, label, value, suffix, reverse = false }) {
  const visualValue = reverse ? 100 - value : value;
  return (
    <div className="meter-card" style={{ "--value": `${clamp(visualValue, 0, 100)}%` }}>
      <Icon size={19} />
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
      <i />
    </div>
  );
}

export default App;
