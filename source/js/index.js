;'use strict';
(function () {

  const Helpers = {
    RAF: requestAnimationFrame.bind(window),

    maxMobileWidth: 768,

    isMobileView(){
      return document.documentElement.clientWidth < Helpers.maxMobileWidth;
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
      SEPARATOR_POS_MAX: 100,
      SEPARATOR_POS_MIN: 0,
      MOBILE: {
        separatorStartPos: 100,
        typeView: 'mobile'
      },
      DESKTOP: {
        separatorStartPos: 50,
        typeView: 'desktop'
      }
    };

    //(( start slider ))
    constructor() {
      const domSlider = document.querySelector(`.${Slider.classNames.SLIDER}`);

      this._handleBtnPrev = this._handleBtnPrev.bind(this);
      this._handleBtnNext = this._handleBtnNext.bind(this);
      this._handleBtnRoll = this._handleBtnRoll.bind(this);
      this._dragRollHandler = this._dragRollHandler.bind(this);
      this._removeDragRollHandler = this._removeDragRollHandler.bind(this);

      this._readyToInit = domSlider && this._areExistDomSliderElems(domSlider);
    }

    init() {
      if (!this._readyToInit) {
        return;
      }

      this._currentTypeView = Helpers.isMobileView()
        ? Slider.config.MOBILE.typeView
        : Slider.config.DESKTOP.typeView;

      this._calcSliderElemsInfo();
      this._placeSliderElems(null);
      this._setupEventListeners();
    }

    reInit() {
      if (!this._readyToInit) {
        return;
      }
      console.log(`reInit`);
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

      if (this._currentTypeView === cfg.DESKTOP.typeView) {
        return cfg.DESKTOP.separatorStartPos;
      }

      if (this._currentTypeView === cfg.MOBILE.typeView) {
        return cfg.MOBILE.separatorStartPos;
      }

      return cfg.SEPARATOR_POS_MAX;
    }

    _placeSliderElems(newSeparatorPos) {
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
      const cfg = Slider.config;
      const diffCoordX = evt.pageX - this._beforeDrag.firstMouseCoordX;

      //(( edge cases in control of roll and separator ))
      if (
        this._beforeDrag.rollPosLeft === this._beforeDrag.rollMaxLeft
        && diffCoordX >= 0
        ||
        this._beforeDrag.rollPosLeft === this._beforeDrag.rollMinLeft
        && diffCoordX <= 0
      ) {
        return;
      }

      const newRollPosLeft = this._beforeDrag.rollPosLeft + diffCoordX;

      if ((newRollPosLeft) > this._beforeDrag.rollMaxLeft) {
        return this._placeSliderElems(cfg.SEPARATOR_POS_MIN);
      }

      if ((newRollPosLeft) < this._beforeDrag.rollMinLeft) {
        return this._placeSliderElems(cfg.SEPARATOR_POS_MAX);
      }

      //(( manual control of roll and separator ))
      this._domNodes.barInner.style.left = `${newRollPosLeft}px`;

      const reverseSeparatorPos = parseInt(
        (newRollPosLeft) / this._beforeDrag.rollMaxLeft * cfg.SEPARATOR_POS_MAX
      );

      this._placeSlidesBySeparator(cfg.SEPARATOR_POS_MAX - reverseSeparatorPos);
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

  //(( client code ))
  let slider = new Slider();
  slider.init();
}());
