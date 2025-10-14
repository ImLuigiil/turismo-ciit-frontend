    // src/components/Header.js
    import React from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import './Header.css';
    import { FaUserCircle } from 'react-icons/fa';


    function Header({ isAdmin, onLogout }) {
      const navigate = useNavigate();

      const handleUserIconClick = () => {
        if (isAdmin) {
          if (window.confirm('¿Quieres cerrar sesión?')) {
            onLogout();
            navigate('/');
          }
        } else {
          navigate('/login');
        }
      };

      return (
        <header className="main-header">
          <div className="header-top-bar">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Logo_del_Gobierno_de_M%C3%A9xico_%282024-2030%29.png/1200px-Logo_del_Gobierno_de_M%C3%A9xico_%282024-2030%29.png" alt="Gobierno de Mexico" className="header-logo-top" />
            <div className="header-top-actions">
              <span className="header-action-item-top">Trámites</span>
              <span className="header-action-item-top">Gobierno</span>
              <FaUserCircle className="user-icon-top" onClick={handleUserIconClick} />
              {isAdmin && (
                <span className="header-action-item-top logout-text" onClick={handleUserIconClick}>
                  (Cerrar Sesión)
                </span>
              )}
            </div>
          </div>

          <div className="header-middle-bar">
            <div className="header-middle-content">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Logo_del_Gobierno_de_M%C3%A9xico_%282024-2030%29.png/1200px-Logo_del_Gobierno_de_M%C3%A9xico_%282024-2030%29.png" alt="Gobierno de México" className="header-logo-middle" />
              <img src="https://www.gob.mx/cms/uploads/action_program/main_image/3180/post_logo_educ.jpg" alt="Educación" className="header-logo-middle" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Tecnologico_Nacional_de_Mexico.svg/1200px-Tecnologico_Nacional_de_Mexico.svg.png" alt="TecNM" className="header-logo-middle" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Instituto_Tecnologico_de_Oaxaca_-_original.svg/2131px-Instituto_Tecnologico_de_Oaxaca_-_original.svg.png" alt="ITOaxaca" className="header-logo-middle" />
            </div>
          </div>

          <nav className="main-nav">
            <div className="nav-container">
              <ul className="nav-list">
                <li className="nav-item">
              <Link to="/">Inicio</Link>
            </li>
                <li className="nav-item"><Link to="/proyectos-turismo">Proyecto Red de Turismo Comunitario</Link></li>
                <li className="nav-item"><Link to="/diplomados">Diplomado</Link></li>
                <li className="nav-item"><Link to="/cursos">Cursos</Link></li>
                <li className="nav-item"><Link to="/fotos">Fotos</Link></li>
                <li className="nav-item"><Link to="/reportes">Reportes</Link></li>
              </ul>
            </div>
          </nav>
        </header>
      );
    }

    export default Header;
    