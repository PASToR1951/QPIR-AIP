import { createPortal } from 'react-dom';

/**
 * Renders the form background directly to document.body via a React portal.
 * This keeps it outside all CSS transform contexts (Framer Motion page transitions,
 * motion.div wrappers), so `position: fixed` always resolves to the viewport —
 * preventing the scale-up and slide/jump on page load.
 */
export default function FormBackground({ orb = 'pink' }) {
    const orbColors = {
        pink:    ['bg-pink-400/20', 'bg-blue-400/20'],
        emerald: ['bg-emerald-400/20', 'bg-blue-400/20'],
        blue:    ['bg-blue-400/20', 'bg-pink-400/20'],
    }[orb] ?? ['bg-pink-400/20', 'bg-blue-400/20'];

    return createPortal(
        <>
            {/* Grid + facade image */}
            <div className="form-bg-fade fixed inset-0 bg-slate-50 dark:bg-dark-base [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-0 print:hidden">
                <div
                    className="absolute inset-0 opacity-100 pointer-events-none grayscale mix-blend-multiply dark:mix-blend-screen"
                    style={{
                        backgroundImage: `url('/SDO_Facade.webp')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 25%',
                    }}
                />
            </div>

            {/* Glowing orbs — static opacity, no continuous animation or expensive blur */}
            <div className={`form-bg-fade fixed top-1/4 left-1/4 w-[30rem] h-[30rem] ${orbColors[0]} rounded-full blur-3xl opacity-40 dark:opacity-30 pointer-events-none z-0 print:hidden`} />
            <div className={`form-bg-fade fixed bottom-1/4 right-1/4 w-[30rem] h-[30rem] ${orbColors[1]} rounded-full blur-3xl opacity-40 dark:opacity-30 pointer-events-none z-0 print:hidden`} />
        </>,
        document.body
    );
}
