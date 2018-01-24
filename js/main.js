/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{
    // From https://davidwalsh.name/javascript-debounce-function.
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
    };

    class Blob {
        constructor(el, options) {
            this.DOM = {};
            this.DOM.el = el;
            this.options = {};
            Object.assign(this.options, options);
            this.init();
        }
        init() {
            this.rect = this.DOM.el.getBoundingClientRect();
            this.descriptions = [];
            this.layers = Array.from(this.DOM.el.querySelectorAll('path'), t => {
                t.style.transformOrigin = `${this.rect.left + this.rect.width/2}px ${this.rect.top + this.rect.height/2}px`;
                t.style.opacity = 0;
                this.descriptions.push(t.getAttribute('d'));
                return t;
            });

            window.addEventListener('resize', debounce(() => {
                this.rect = this.DOM.el.getBoundingClientRect();
                this.layers.forEach(layer => layer.style.transformOrigin = `${this.rect.left + this.rect.width/2}px ${this.rect.top + this.rect.height/2}px`);
            }, 20));
        }
        intro() {
            anime.remove(this.layers);
            anime({
                targets: this.layers,
                duration: 1800,
                delay: (t,i) => i*120,
                easing: [0.2,1,0.1,1],
                scale: [0.2,1],
                opacity: {
                    value: [0,1],
                    duration: 300,
                    delay: (t,i) => i*120,
                    easing: 'linear'
                }
            });
        }
        expand() {
            return new Promise((resolve, reject) => {
                let halfway = false;
                anime({
                    targets: this.layers,
                    duration: 1000,
                    delay: (t,i) => i*50 + 200,
                    easing: [0.8,0,0.1,0],
                    d: (t) => t.getAttribute('pathdata:id'),
                    update: function(anim) {
                        if ( anim.progress > 75 && !halfway ) {
                            halfway = true;
                            resolve();
                        }
                    }
                });
            });
        }
        collapse() {
            return new Promise((resolve, reject) => {
                let halfway = false;
                anime({
                    targets: this.layers,
                    duration: 800,
                    delay: (t,i,total) => (total-i-1)*50 + 400,
                    easing: [0.2,1,0.1,1],
                    d: (t,i) => this.descriptions[i],
                    update: function(anim) {
                        if ( anim.progress > 75 && !halfway ) {
                            halfway = true;
                            resolve();
                        }
                    }
                });
            });
        }
        hide() {
            anime.remove(this.layers);
            anime({
                targets: this.layers,
                duration: 800,
                delay: (t,i,total) => (total-i-1)*80,
                easing: 'easeInOutExpo',
                scale: 0,
                opacity: {
                    value: 0,
                    duration: 500,
                    delay: (t,i,total) => (total-i-1)*80,
                    easing: 'linear'
                }
            });
        }
        show() {
            setTimeout(() => this.intro(), 400);
        }
    };

    window.Blob = Blob;

    const DOM = {};
    let blobs = [];
    DOM.svg = document.querySelector('svg.scene');
    Array.from(DOM.svg.querySelectorAll('g')).forEach((el) => {
        const blob = new Blob(el);
        blobs.push(blob);
        blob.intro();
    });
    
    DOM.content = document.querySelector('.content--reveal');
    DOM.contentInner = Array.from(DOM.content.querySelectorAll('.content__inner'), (el) => {
        charming(el);
        return el;
    });
    DOM.ctrlBack = DOM.content.querySelector('.content__close');
    DOM.links = Array.from(document.querySelectorAll('.menu > .menu__item'));
    
    DOM.links.forEach((link, pos) => {
        link.style.pointerEvents = 'none';
        charming(link);

        anime({
            targets: link.querySelectorAll('span'),
            duration: 800,
            delay: (t,i) => anime.random(0,600)+500,
            easing: 'easeInOutQuad',
            opacity: [0,1],
            complete: () => {
                link.style.pointerEvents = 'auto';
                link.classList.add('menu__item--showDeco');
            }
        });

        link.addEventListener('click', (ev) => {
            ev.preventDefault();
            open(pos);
        });
    });

    DOM.ctrlBack.addEventListener('click', () => close());

    let current;
    const open = (pos) => {
        this.isOpen = true;
        anime({
            targets: DOM.links.map((link) => link.querySelectorAll('span')),
            delay: (t,i) => anime.random(0,300),
            duration: 200,
            easing: 'easeInOutQuad',
            opacity: 0,
            begin: () => DOM.links.forEach(link => {
                link.style.pointerEvents = 'none';
                link.classList.remove('menu__item--showDeco');
            })
        });

        current = pos;
        const currentBlob = blobs[current];
        currentBlob.expand().then(() => {
            DOM.content.style.pointerEvents = 'auto';

            const contentInner = DOM.contentInner[pos];
            contentInner.style.opacity = 1;
            anime({
                targets: [contentInner.querySelectorAll('.content__title > span'), contentInner.querySelectorAll('.content__subtitle > span'), DOM.ctrlBack],
                duration: 200,
                delay: (t,i) => anime.random(0,600),
                easing: 'easeInOutQuad',
                opacity: [0,1]
            });
        });

        blobs.filter(el => el != currentBlob).forEach(blob => blob.hide());
    };

    const close = () => {
        if ( !this.isOpen ) return;
        this.isOpen = false;
        
        const contentInner = DOM.contentInner[current];
        anime({
            targets: [contentInner.querySelectorAll('.content__title > span'), contentInner.querySelectorAll('.content__subtitle > span'), DOM.ctrlBack],
            delay: (t,i) => anime.random(0,300),
            duration: 200,
            easing: 'easeInOutQuad',
            opacity: 0,
            complete: () => {
                contentInner.style.opacity = 0;
                DOM.content.style.pointerEvents = 'none';
            }
        });

        blobs[current].collapse().then(() => {
            current = -1;

            anime({
                targets: DOM.links.map((link) => link.querySelectorAll('span')),
                duration: 200,
                delay: (t,i) => anime.random(0,600),
                easing: 'easeInOutQuad',
                opacity: 1,
                complete: () => DOM.links.forEach(link => {
                    link.style.pointerEvents = 'auto';
                    link.classList.add('menu__item--showDeco');
                })
            });
        });
        blobs.filter(el => el != blobs[current]).forEach(blob => blob.show());
    };
};