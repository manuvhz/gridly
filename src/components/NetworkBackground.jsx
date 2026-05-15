import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function NetworkBackground() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, host.clientWidth / host.clientHeight, 0.1, 1000);
    camera.position.z = 78;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const nodeCount = 72;
    const positions = [];
    const nodes = [];
    for (let index = 0; index < nodeCount; index += 1) {
      const radius = 18 + Math.random() * 34;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const node = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      nodes.push(node);
      positions.push(node.x, node.y, node.z);
    }

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x7cf7c2,
      size: 0.75,
      transparent: true,
      opacity: 0.9,
    });
    const points = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(points);

    const linePositions = [];
    nodes.forEach((node, index) => {
      nodes.slice(index + 1).forEach((other) => {
        if (node.distanceTo(other) < 18) {
          linePositions.push(node.x, node.y, node.z, other.x, other.y, other.z);
        }
      });
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x1fd890,
      transparent: true,
      opacity: 0.18,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const packetGeometry = new THREE.SphereGeometry(0.62, 16, 16);
    const packetMaterial = new THREE.MeshBasicMaterial({ color: 0xd9f99d });
    const packets = Array.from({ length: 7 }, (_, index) => {
      const mesh = new THREE.Mesh(packetGeometry, packetMaterial);
      mesh.userData = { speed: 0.006 + index * 0.001, offset: index * 0.85 };
      scene.add(mesh);
      return mesh;
    });

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    let rafId = 0;
    const animate = () => {
      frame += 1;
      points.rotation.y += 0.0014;
      points.rotation.x += 0.00045;
      lines.rotation.copy(points.rotation);

      packets.forEach((packet, index) => {
        const from = nodes[(index * 9 + Math.floor(frame * packet.userData.speed)) % nodes.length];
        const to = nodes[(index * 9 + 14 + Math.floor(frame * packet.userData.speed)) % nodes.length];
        const t = (Math.sin(frame * packet.userData.speed + packet.userData.offset) + 1) / 2;
        packet.position.lerpVectors(from, to, t);
        packet.rotation.copy(points.rotation);
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      host.removeChild(renderer.domElement);
      renderer.dispose();
      nodeGeometry.dispose();
      lineGeometry.dispose();
      nodeMaterial.dispose();
      lineMaterial.dispose();
      packetGeometry.dispose();
      packetMaterial.dispose();
    };
  }, []);

  return <div ref={hostRef} className="network-background" aria-hidden="true" />;
}
