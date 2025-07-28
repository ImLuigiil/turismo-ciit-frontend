// src/components/HomePage.js
import React from 'react';
import './HomePage.css'; // Crearemos este archivo CSS en el Paso 5

function HomePage() {
  return (
    <div className="home-page-content">
      <section className="hero-section">
        {/* Aquí puedes usar una imagen de fondo o un elemento de imagen */}
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOZzoCSj8h9l239l0bYNtBby5lQ_JxushFiw&s"
          alt="San Pedro Juameluca"
          className="hero-image"
        />
      </section>

      <section className="description-section">
        <h2>Desarrollo de una aplicación web para el seguimiento y control de proyectos de turismo comunitario en el Corredor Interoceánico (CIIT)</h2>
        <p>
          Actualmente, el Corredor Interoceánico (CIIT) enfrenta un desafío fundamental
          relacionado con la gestión de la información sobre las iniciativas de turismo
          comunitario que impulsa. La carencia de una página web centralizada y eficiente
          para recopilar y organizar los datos relevantes de estos proyectos se traduce en una
          desinformación institucional significativa. Esta situación genera una desinformación
          institucional que impacta negativamente la capacidad del CIIT para evaluar el impacto
          de sus inversiones, identificar áreas de mejora y tomar decisiones estratégicas
          informadas para el sector.
        </p>
        <p>
          El desarrollo de una aplicación web para el seguimiento y control de proyectos de
          turismo comunitario se presenta como una solución crucial para abordar esta
          problemática de desinformación, permitiendo una gestión centralizada y eficiente de la información.
        </p>
        {/* Puedes añadir más texto aquí de tu documentación si lo deseas */}
      </section>
    </div>
  );
}

export default HomePage;