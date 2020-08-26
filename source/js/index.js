;'use strict';
(function () {

  const Helpers = {
    RAF: requestAnimationFrame.bind(window),

    maxMobileWidth: 768,

    isMobileView(maxMobileWidth = Helpers.maxMobileWidth){
      return document.documentElement.clientWidth < maxMobileWidth;
    },

    throttle: function (func, ms) {

      let isThrottled = false;
      let savedArgs;
      let savedThis;

      function wrapper() {

        if (isThrottled) {
          savedArgs = arguments;
          savedThis = this;
          return;
        }

        func.apply(this, arguments);

        isThrottled = true;

        setTimeout(function () {
          isThrottled = false;
          if (savedArgs) {
            wrapper.apply(savedThis, savedArgs);
            savedArgs = savedThis = null;
          }
        }, ms);
      }

      return wrapper;
    }
  };

  /*
   Separator - невидимая линия, разделяющая картинки на слайдере
   Когда позиция separator максимальна (100) - значит разделитель
   максимально смещен вправо, открывая первый слайд. Аналогично
   Separator = 0, когда разделитель смещен максимально влево, открывая
   второй слайд

   Встречаемое сочетание букв "btn" используется для клавиш
   "следующий\предыдущий слайд"

   Встречаемое сочетание букв "roll" используется для  ползунока
   управления слайдером
   */
  class Slider {

    static classNames = {
      SLIDER: 'slider',
      SLIDE: 'slider__slide',
      BTN_PREV: 'slider__btn--prevJS',
      BTN_NEXT: 'slider__btn--nextJS',
      BAR_OUTER: 'slider__bar',
      BAR_INNER: 'slider__roll'
    };

    static config = {
      THROTTLE_TIME_RELOAD: 500,
      THROTTLE_TIME_DRAG: 33,
      SEPARATOR_POS_MAX: 100,
      SEPARATOR_POS_MIN: 0,
      mobile: {
        SEPARATOR_START_POS: 100,
        TYPE_VIEW: 'mobile'
      },
      desktop: {
        SEPARATOR_START_POS: 50,
        TYPE_VIEW: 'desktop'
      }
    };

    //(( start slider ))
    constructor() {
      const domSlider = document.querySelector(`.${Slider.classNames.SLIDER}`);

      this._handleBtnPrev = this._handleBtnPrev.bind(this);
      this._handleBtnNext = this._handleBtnNext.bind(this);
      this._handleBtnRoll = this._handleBtnRoll.bind(this);
      this._removeDragRollHandler = this._removeDragRollHandler.bind(this);
      this._dragRollHandler = Helpers.throttle(
        this._dragRollHandler.bind(this), Slider.config.THROTTLE_TIME_DRAG
      );
      this._reload = Helpers.throttle(
        this._reload.bind(this), Slider.config.THROTTLE_TIME_RELOAD
      );

      this._readyToInit = domSlider && this._areExistDomSliderElems(domSlider);
    }

    init() {
      if (!this._readyToInit) {
        return;
      }

      this._setupSliderTypeView();
      this._calcSliderElemsInfo();
      this._placeSliderElems();
      this._setupEventListeners();
    }

    _reload() {
      if (
        Helpers.isMobileView()
        && this._currentTypeView === Slider.config.mobile.TYPE_VIEW
        || !Helpers.isMobileView()
        && this._currentTypeView === Slider.config.desktop.TYPE_VIEW
      ) {
        return;
      }

      this._setupSliderTypeView();
      this._calcSliderElemsInfo();
      this._placeSliderElems(null);
    }

    _setupSliderTypeView() {
      this._currentTypeView = Helpers.isMobileView()
        ? Slider.config.mobile.TYPE_VIEW
        : Slider.config.desktop.TYPE_VIEW;
    }

    _areExistDomSliderElems(domSlider) {
      this._domNodes = {
        slider: domSlider,
        slides: domSlider.querySelectorAll(`.${Slider.classNames.SLIDE}`),
        btnPrev: domSlider.querySelector(`.${Slider.classNames.BTN_PREV}`),
        btnNext: domSlider.querySelector(`.${Slider.classNames.BTN_NEXT}`),
        barOuter: domSlider.querySelector(`.${Slider.classNames.BAR_OUTER}`),
        barInner: domSlider.querySelector(`.${Slider.classNames.BAR_INNER}`)
      };

      return (
        this._domNodes.slides.length === 2
        && this._domNodes.btnPrev
        && this._domNodes.btnNext
        && this._domNodes.barOuter
        && this._domNodes.barInner
      );
    }


    //(( render after some actions ))
    _getInitialSeparatorPos() {
      const cfg = Slider.config;

      if (this._currentTypeView === cfg.desktop.TYPE_VIEW) {
        return cfg.desktop.SEPARATOR_START_POS;
      }

      if (this._currentTypeView === cfg.mobile.TYPE_VIEW) {
        return cfg.mobile.SEPARATOR_START_POS;
      }

      return cfg.SEPARATOR_POS_MAX;
    }

    _placeSliderElems(newSeparatorPos = null) {
      let separatorPos = newSeparatorPos === null
        ? this._getInitialSeparatorPos()
        : newSeparatorPos;

      this._placeSlidesBySeparator(separatorPos);
      this._placeRollBySeparator(separatorPos);
    }

    _placeSlidesBySeparator(separatorPos) {
      this._domNodes.slides[0].style.width = `${separatorPos}%`;
      this._domNodes.slides[1].style.width =
        `${Slider.config.SEPARATOR_POS_MAX - separatorPos}%`;
    }

    _placeRollBySeparator(separatorPos) {
      const cfg = Slider.config;
      const availableRollMove = this._barProps.width - this._rollProps.width;
      const rollLeftPosPx = parseInt(
        (cfg.SEPARATOR_POS_MAX - separatorPos)
        * availableRollMove
        / cfg.SEPARATOR_POS_MAX
      );

      this._domNodes.barInner.style.left = `${rollLeftPosPx}px`;
    }


    //(( info about slider's elements ))
    _calcSliderElemsInfo() {
      this._barProps = this._getPropsOfBar();
      this._rollProps = this._getPropsOfRoll();
    }

    _getPropsOfBar() {
      const barCssStyle = getComputedStyle(this._domNodes.barOuter);
      const barProps = {
        widthWithPadding: this._domNodes.barOuter.clientWidth,
        paddingLeftWidth: parseFloat(barCssStyle.paddingLeft),
        paddingRightWidth: parseFloat(barCssStyle.paddingRight)
      };
      barProps.width = barProps.widthWithPadding
        - barProps.paddingLeftWidth
        - barProps.paddingRightWidth;

      return barProps;
    }

    _getPropsOfRoll() {
      const rollCssStyle = getComputedStyle(this._domNodes.barInner);
      const rollProps = {
        widthWithPadding: this._domNodes.barInner.clientWidth,
        borderLeftWidth: parseFloat(rollCssStyle.borderLeft),
        borderRightWidth: parseFloat(rollCssStyle.borderRight)
      };
      rollProps.width = rollProps.widthWithPadding
        + rollProps.borderLeftWidth
        + rollProps.borderRightWidth;

      return rollProps;
    }


    //(( work with listeners ))
    _setupEventListeners() {
      this._domNodes.btnPrev.addEventListener('click', this._handleBtnPrev);
      this._domNodes.btnNext.addEventListener('click', this._handleBtnNext);
      window.addEventListener('resize', this._reload);
      this._handleBtnRoll();
    }

    _handleBtnPrev() {
      Helpers.RAF(() => {
        this._placeSliderElems(Slider.config.SEPARATOR_POS_MAX);
      });
    }

    _handleBtnNext() {
      Helpers.RAF(() => {
        this._placeSliderElems(Slider.config.SEPARATOR_POS_MIN);
      });
    }

    _handleBtnRoll() {
      const btnRoll = this._domNodes.barInner;
      this._disableBrowserDragging(btnRoll);

      btnRoll.addEventListener('mousedown', (evt) => {
        this._beforeDrag = {
          rollPosLeft: parseInt(this._domNodes.barInner.style.left),
          rollMaxLeft: this._barProps.width - this._rollProps.width,
          rollMinLeft: 0,
          firstMouseCoordX: evt.pageX,
        };

        document.addEventListener('mousemove', this._dragRollHandler);
        document.addEventListener('mouseup', this._removeDragRollHandler);
      });
    }

    _dragRollHandler(evt) {
      const diffCoordX = evt.pageX - this._beforeDrag.firstMouseCoordX;

      if (!this._dragRollEdgeCasesControl(diffCoordX)) {
        this._dragRollManualControl(diffCoordX);
      }
    }

    _dragRollEdgeCasesControl(diffCoordX) {
      const cfg = Slider.config;
      if (
        this._beforeDrag.rollPosLeft === this._beforeDrag.rollMaxLeft
        && diffCoordX >= 0
        ||
        this._beforeDrag.rollPosLeft === this._beforeDrag.rollMinLeft
        && diffCoordX <= 0
      ) {
        return true;
      }

      const newRollPosLeft = this._beforeDrag.rollPosLeft + diffCoordX;

      if ((newRollPosLeft) > this._beforeDrag.rollMaxLeft) {
        Helpers.RAF(() => {
          this._placeSliderElems(cfg.SEPARATOR_POS_MIN);
        });
        return true;
      }

      if ((newRollPosLeft) < this._beforeDrag.rollMinLeft) {
        Helpers.RAF(() => {
          this._placeSliderElems(cfg.SEPARATOR_POS_MAX);
        });
        return true;
      }

      return false;
    }

    _dragRollManualControl(diffCoordX) {
      const cfg = Slider.config;
      const newRollPosLeft = this._beforeDrag.rollPosLeft + diffCoordX;
      const reverseSeparatorPos = parseInt(
        (newRollPosLeft) / this._beforeDrag.rollMaxLeft * cfg.SEPARATOR_POS_MAX
      );

      Helpers.RAF(() => {
        this._domNodes.barInner.style.left = `${newRollPosLeft}px`;
        this._placeSlidesBySeparator(cfg.SEPARATOR_POS_MAX - reverseSeparatorPos);
      });
    }

    _removeDragRollHandler() {
      document.removeEventListener('mousemove', this._dragRollHandler);
      document.removeEventListener('mouseup', this._removeDragRollHandler);
    }

    _disableBrowserDragging(domElem) {
      domElem.addEventListener('dragstart', (evtDragStart) => {
        evtDragStart.preventDefault();
        return false;
      });
    }
  }

  class Nav {

    static classNames = {
      NAV: 'header__wrapNav',
      NAV_CLOSED: 'header__wrapNav--closedJS',
      SPIN_BTN: 'hamburger',
      SPIN_BTN_CLOSED_NAV: 'hamburger--pressedJS'
    };

    static config = {
      THROTTLE_TIME: 500
    };

    constructor() {
      this._domNav = document.querySelector(`.${Nav.classNames.NAV}`);
      this._domSpinBtn = document.querySelector(`.${Nav.classNames.SPIN_BTN}`);
      this._readyToInit = this._domNav && this._domSpinBtn;

      this._handleSpinBtn = this._handleSpinBtn.bind(this);
      this._reload =
        Helpers.throttle(this._reload.bind(this), Nav.config.THROTTLE_TIME);
    }

    init() {
      if (!this._readyToInit) {
        return;
      }

      this._domSpinBtn.addEventListener('click', this._handleSpinBtn);
      window.addEventListener('resize', this._reload);

      if (Helpers.isMobileView()) {
        this._domNav.classList.add(Nav.classNames.NAV_CLOSED);
      }
    }

    _reload() {
      if (Helpers.isMobileView()) {
        this._domNav.classList.add(Nav.classNames.NAV_CLOSED);
        this._domSpinBtn.classList.remove(Nav.classNames.SPIN_BTN_CLOSED_NAV);
      } else {
        this._domNav.classList.remove(Nav.classNames.NAV_CLOSED);
      }
    }

    _handleSpinBtn() {
      this._domNav.classList.toggle(Nav.classNames.NAV_CLOSED);
      this._domSpinBtn.classList.toggle(Nav.classNames.SPIN_BTN_CLOSED_NAV);
    }
  }

  class Map {

    static config = {
      ID: 'map',
      SRC_YANDEX_MAP_API: 'https://api-maps.yandex.ru/2.1/?lang=ru_RU',
      THROTTLE_TIME_RELOAD: 500,
      mobile: {
        TYPE_VIEW: 'mobile',
        CENTER_COORDS: [59.93857427, 30.32311762],
        ZOOM: 15,
        ZOOM_COORDS: {
          top: 20,
          left: 20
        },
        placeMark: {
          COORDS: [59.93852105, 30.32322291],
          icon: {
            LAYOUT: 'default#image',
            IMAGE_HREF: '../img/map-pin.png',
            IMAGE_SIZE: [57, 53],
            IMAGE_OFFSET: [-28, -53]
          }
        }
      },
      tablet: {
        TYPE_VIEW: 'tablet',
        MAX_VIEW_WIDTH: 1440,
        CENTER_COORDS: [59.93857427, 30.32311762],
        ZOOM: 15,
        ZOOM_COORDS: {
          top: 20,
          left: 20
        },
        placeMark: {
          COORDS: [59.93852105, 30.32322291],
          icon: {
            LAYOUT: 'default#image',
            IMAGE_HREF: '../img/map-pin.png',
            IMAGE_SIZE: [113, 106],
            IMAGE_OFFSET: [-52, -106]
          }
        }
      },
      desktop: {
        TYPE_VIEW: 'desktop',
        CENTER_COORDS: [59.93836854, 30.31903718],
        ZOOM: 16,
        ZOOM_COORDS: {
          top: 20,
          right: 20
        },
        placeMark: {
          COORDS: [59.93852105, 30.32322291],
          icon: {
            LAYOUT: 'default#image',
            IMAGE_HREF: '../img/map-pin.png',
            IMAGE_SIZE: [113, 106],
            IMAGE_OFFSET: [-52, -106]
          }
        }
      }
    };

    constructor() {
      this._domMap = document.querySelector(`#${Map.config.ID}`);
      this._readyToInit = !!this._domMap;
      this._renderMap = this._renderMap.bind(this);
      this._reload = Helpers.throttle(
        this._reload.bind(this), Map.config.THROTTLE_TIME_RELOAD
      );
    }

    init() {
      if (!this._readyToInit) {
        return;
      }

      this._setupMapTypeView();
      this._createAndLoadAPIScript();
      window.addEventListener('resize', this._reload);
    }

    _reload() {
      if (
        this._currentTypeView === Map.config.mobile.TYPE_VIEW
        && Helpers.isMobileView()
        ||
        this._currentTypeView === Map.config.tablet.TYPE_VIEW
        && (!Helpers.isMobileView())
        && Helpers.isMobileView(Map.config.tablet.MAX_VIEW_WIDTH)
        ||
        this._currentTypeView === Map.config.desktop.TYPE_VIEW
        && (!Helpers.isMobileView(Map.config.tablet.MAX_VIEW_WIDTH))
      ) {
        return;
      }

      this._setupMapTypeView();
      if (this._placeMark) {
        this._myMap.geoObjects.remove(this._placeMark);
      }
      this._placeMark = this._createPlaceMark();
      this._myMap.geoObjects.add(this._placeMark);
      this._myMap.setCenter(
        Map.config[this._currentTypeView].CENTER_COORDS,
        Map.config[this._currentTypeView].ZOOM
      );
    }

    _setupMapTypeView() {
      if (Helpers.isMobileView()) {
        this._currentTypeView = Map.config.mobile.TYPE_VIEW;
        return;
      }

      if (
        !Helpers.isMobileView()
        && Helpers.isMobileView(Map.config.tablet.MAX_VIEW_WIDTH)
      ) {
        this._currentTypeView = Map.config.tablet.TYPE_VIEW;
        return;
      }

      this._currentTypeView = Map.config.desktop.TYPE_VIEW;
    }

    _createAndLoadAPIScript() {
      const script = document.createElement("script");
      script.src = Map.config.SRC_YANDEX_MAP_API;
      script.type = "text/javascript";
      script.addEventListener('load', () => {
        ymaps.ready(this._renderMap);
      });
      document.body.append(script);
    }

    _renderMap() {
      this._domMap.innerHTML = "";

      const cfg = this._currentTypeView === Map.config.mobile.TYPE_VIEW
        ? Map.config.mobile
        : this._currentTypeView === Map.config.tablet.TYPE_VIEW
          ? Map.config.tablet
          : Map.config.desktop;

      this._myMap = new ymaps.Map(Map.config.ID, {
        center: cfg.CENTER_COORDS,
        zoom: cfg.ZOOM,
        controls: [],
      });

      this._myMap.behaviors.disable('scrollZoom');
      this._myMap.controls.add('zoomControl', {
        size: "auto",
        position: cfg.ZOOM_COORDS
      });
      this._placeMark = this._createPlaceMark();
      this._myMap.geoObjects.add(this._placeMark);
    }

    _createPlaceMark() {
      const cfgPlaceMark = Map.config[this._currentTypeView].placeMark;

      return new ymaps.Placemark(cfgPlaceMark.COORDS, {}, {
        iconLayout: cfgPlaceMark.icon.LAYOUT,
        iconImageHref: cfgPlaceMark.icon.IMAGE_HREF,
        iconImageSize: cfgPlaceMark.icon.IMAGE_SIZE,
        iconImageOffset: cfgPlaceMark.icon.IMAGE_OFFSET
      });
    }
  }


  //(( client code ))
  let slider = new Slider();
  let nav = new Nav();
  let map = new Map();
  slider.init();
  nav.init();
  map.init();
}());
