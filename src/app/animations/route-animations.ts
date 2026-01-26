import {
  trigger,
  transition,
  style,
  query,
  animate,
  group,
} from '@angular/animations';

// Elegant fade + subtle slide animation for route transitions
// Duration: 300ms with smooth easing for a polished feel

export const routeAnimations = trigger('routeAnimations', [
  // Default transition between any pages
  transition('* <=> *', [
    // Set initial styles for both pages
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
      }),
    ], { optional: true }),

    // Start: entering page is below and invisible
    query(':enter', [
      style({
        opacity: 0,
        transform: 'translateY(20px)',
      }),
    ], { optional: true }),

    // Animate both pages simultaneously
    group([
      // Leaving page: fade out and slide up
      query(':leave', [
        animate('200ms ease-out', style({
          opacity: 0,
          transform: 'translateY(-10px)',
        })),
      ], { optional: true }),

      // Entering page: fade in and slide up to position
      query(':enter', [
        animate('300ms 100ms ease-out', style({
          opacity: 1,
          transform: 'translateY(0)',
        })),
      ], { optional: true }),
    ]),
  ]),
]);

// Alternative: Simpler fade-only animation (can be used for auth pages)
export const fadeAnimation = trigger('fadeAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
      }),
    ], { optional: true }),

    query(':enter', [
      style({ opacity: 0 }),
    ], { optional: true }),

    group([
      query(':leave', [
        animate('200ms ease-out', style({ opacity: 0 })),
      ], { optional: true }),

      query(':enter', [
        animate('300ms 100ms ease-out', style({ opacity: 1 })),
      ], { optional: true }),
    ]),
  ]),
]);

// Slide animation for hierarchical navigation (e.g., list -> detail)
export const slideAnimation = trigger('slideAnimation', [
  // Forward navigation: slide from right
  transition(':increment', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        width: '100%',
      }),
    ], { optional: true }),

    query(':enter', [
      style({
        transform: 'translateX(100%)',
        opacity: 0,
      }),
    ], { optional: true }),

    group([
      query(':leave', [
        animate('300ms ease-out', style({
          transform: 'translateX(-30%)',
          opacity: 0,
        })),
      ], { optional: true }),

      query(':enter', [
        animate('300ms ease-out', style({
          transform: 'translateX(0)',
          opacity: 1,
        })),
      ], { optional: true }),
    ]),
  ]),

  // Back navigation: slide from left
  transition(':decrement', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        width: '100%',
      }),
    ], { optional: true }),

    query(':enter', [
      style({
        transform: 'translateX(-100%)',
        opacity: 0,
      }),
    ], { optional: true }),

    group([
      query(':leave', [
        animate('300ms ease-out', style({
          transform: 'translateX(30%)',
          opacity: 0,
        })),
      ], { optional: true }),

      query(':enter', [
        animate('300ms ease-out', style({
          transform: 'translateX(0)',
          opacity: 1,
        })),
      ], { optional: true }),
    ]),
  ]),
]);
