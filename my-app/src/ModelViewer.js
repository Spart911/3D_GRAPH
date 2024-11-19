import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";

function ModelViewer() {
  const mountRef = useRef(null);
  const transformControlsRef = useRef(null);
  const meshRef = useRef(null);
  const boundingBoxHelperRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);

  const updateBoundingBox = useCallback(() => {
    const mesh = meshRef.current;
    if (mesh) {
      const boundingBox = new THREE.Box3().setFromObject(mesh, true);

      if (boundingBoxHelperRef.current) {
        mesh.parent.remove(boundingBoxHelperRef.current);
      }

      const boundingBoxHelper = new THREE.Box3Helper(boundingBox, 0xffff00);
      boundingBoxHelperRef.current = boundingBoxHelper;
      mesh.parent.add(boundingBoxHelper);

      boundingBoxHelper.position
        .copy(boundingBox.getCenter(new THREE.Vector3()))
        .setZ(boundingBox.min.z);
    }
  }, []);

  const handleTransformChange = useCallback(() => {
    const mesh = meshRef.current;
    if (mesh) {
      updateBoundingBox();
      
      const boundingBoxHelper = boundingBoxHelperRef.current;
      if (boundingBoxHelper) {
        const boundingBoxMinY = boundingBoxHelper.box.min.y;

        if (boundingBoxMinY < 0) {
          mesh.position.y -= boundingBoxMinY;
        }

        const boundingBoxMinX = boundingBoxHelper.box.min.x;

        if (boundingBoxMinX < -100) {
          mesh.position.x -= boundingBoxMinX;
        }


        const tableSize = 200;
        const boundingBoxSize = new THREE.Vector3();
        boundingBoxHelper.box.getSize(boundingBoxSize);

        const halfSizeX = boundingBoxSize.x / 2;
        const halfSizeZ = boundingBoxSize.z / 2;

        if (mesh.position.x + halfSizeX > tableSize / 2) {
          mesh.position.x = tableSize / 2 - halfSizeX;
        }
        if (mesh.position.x - halfSizeX < -tableSize / 2) {
          mesh.position.x = -tableSize / 2 + halfSizeX;
        }

        if (mesh.position.z + halfSizeZ > tableSize / 2) {
          mesh.position.z = tableSize / 2 - halfSizeZ;
        }
        if (mesh.position.z - halfSizeZ < -tableSize / 2) {
          mesh.position.z = -tableSize / 2 + halfSizeZ;
        }

        if (transformControlsRef.current.getMode() === "scale") {
          const minScale = 0.1;
          const maxScale = 10;

          mesh.scale.set(
            THREE.MathUtils.clamp(mesh.scale.x, minScale, maxScale),
            THREE.MathUtils.clamp(mesh.scale.y, minScale, maxScale),
            THREE.MathUtils.clamp(mesh.scale.z, minScale, maxScale)
          );
          mesh.geometry.computeBoundingBox();
          updateBoundingBox();
        }
      }
    }
  }, [updateBoundingBox]);

  const resetTransforms = useCallback(() => {
    const mesh = meshRef.current;
    if (mesh) {
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      transformControlsRef.current.update();
      updateBoundingBox();
    }
  }, [updateBoundingBox]);

  const loadModel = (file) => {
    const reader = new FileReader();
    const loader = new STLLoader();
    reader.onload = function (event) {
      const contents = event.target.result;
      const geometry = loader.parse(contents);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x61875e,
        metalness: 0,
        roughness: 0,
        opacity: 1.0,
        transparent: true,
        transmission: 0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.geometry.center();
      mesh.geometry.computeBoundingBox();
      mesh.position.y = mesh.geometry.boundingBox.max.y;

      const scene = sceneRef.current;
      if (scene && meshRef.current) {
        scene.remove(meshRef.current);
      }

      if (scene) {
        scene.add(mesh);
        meshRef.current = mesh;

        transformControlsRef.current.attach(mesh);
        updateBoundingBox();
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const lowerModelToGround = useCallback(() => {
    const mesh = meshRef.current;
    const boundingBoxHelper = boundingBoxHelperRef.current;
  
    if (mesh && boundingBoxHelper) {
      const boundingBoxMinY = boundingBoxHelper.box.min.y;
  
      if (boundingBoxMinY > 0) {
        // Поднимаем объект так, чтобы нижняя грань касалась пола
        mesh.position.y -= boundingBoxMinY;
        updateBoundingBox();
      }
    }
  }, [updateBoundingBox]);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    const light1 = new THREE.SpotLight(0xffffff, 1000000);
    light1.position.set(400, 200, 200);

    const light2 = new THREE.SpotLight(0xffffff, 1000000);
    light2.position.set(2, -50, -300);

    const light3 = new THREE.SpotLight(0xffffff, 1000000);
    light3.position.set(2, -50, 300);

    scene.add(light1);
    scene.add(light2);
    scene.add(light3);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    camera.position.set(0, 150, -150);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      })
    );
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    transformControlsRef.current = new TransformControls(
      camera,
      renderer.domElement
    );
    scene.add(transformControlsRef.current);

    transformControlsRef.current.addEventListener("dragging-changed", (event) => {
      controls.enabled = !event.value;
    });

    transformControlsRef.current.addEventListener("change", handleTransformChange);

    const handleKeyDown = (event) => {
      console.log(`Key pressed: ${event.key}`);
      switch (event.key) {
        case "t":
          transformControlsRef.current.setMode("translate");
          break;
        case "r":
          transformControlsRef.current.setMode("rotate");
          break;
        case "s":
          transformControlsRef.current.setMode("scale");
          break;
        case "x":
          resetTransforms();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      mount.removeChild(renderer.domElement);
    };
  }, [handleTransformChange, resetTransforms]);

  return (
    <>
      <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />
      <input
        type="file"
        accept=".stl"
        onChange={(e) => loadModel(e.target.files[0])}
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "20px",
        }}
      />
      <button
        onClick={() => lowerModelToGround()}
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "60px",
          padding: "10px",
          backgroundColor: "#4CAF50",
          color: "white",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Опустить до пола
      </button>
    </>
  );
}

export default ModelViewer;