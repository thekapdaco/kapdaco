import React from 'react';
import { motion } from 'framer-motion';
import { Ruler, Info } from 'lucide-react';
import { KCCard, KCButton } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const SizeGuide = () => {
  const sizeCharts = [
    {
      title: 'T-Shirts & Tops',
      category: 'apparel',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      measurements: {
        'Chest (inches)': [36, 38, 40, 42, 44, 46],
        'Chest (cm)': [91, 97, 102, 107, 112, 117],
        'Length (inches)': [26, 27, 28, 29, 30, 31],
        'Length (cm)': [66, 69, 71, 74, 76, 79],
        'Shoulder (inches)': [16, 16.5, 17, 17.5, 18, 18.5],
        'Shoulder (cm)': [41, 42, 43, 44, 46, 47],
      },
    },
    {
      title: 'Hoodies & Sweatshirts',
      category: 'apparel',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      measurements: {
        'Chest (inches)': [38, 40, 42, 44, 46, 48],
        'Chest (cm)': [97, 102, 107, 112, 117, 122],
        'Length (inches)': [27, 28, 29, 30, 31, 32],
        'Length (cm)': [69, 71, 74, 76, 79, 81],
        'Sleeve (inches)': [32, 33, 34, 35, 36, 37],
        'Sleeve (cm)': [81, 84, 86, 89, 91, 94],
      },
    },
    {
      title: 'Caps',
      category: 'accessories',
      sizes: ['One Size'],
      measurements: {
        'Head Circumference': ['22" - 24" (56-61 cm)'],
      },
    },
  ];

  const fitTips = [
    {
      title: 'How to Measure',
      content: [
        'Chest: Measure around the fullest part of your chest, keeping the tape horizontal.',
        'Length: Measure from the top of the shoulder down to the desired length.',
        'Shoulder: Measure from shoulder seam to shoulder seam across the back.',
        'Sleeve: Measure from the center back of the neck, over the shoulder, to the wrist.',
      ],
    },
    {
      title: 'Fit Guide',
      content: [
        'Regular Fit: Our standard fit provides comfortable room for movement.',
        'If between sizes: We recommend sizing up for a relaxed fit, or down for a more fitted look.',
        'Model Reference: Our models are 6\'0" and typically wear size L.',
        'Custom Fit: Use our Custom Atelier for made-to-measure pieces.',
      ],
    },
  ];

  return (
    <main className="space-y-16 pb-24 pt-24">
      <section className="premium-noise">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="kc-container text-center text-white"
        >
          <div className="mb-6 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
              <Ruler size={32} />
            </span>
          </div>
          <h1 className="text-[clamp(2.8rem,4vw,4.6rem)] leading-tight">
            Size Guide <span className="kc-text-brand">Archive</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-white/75">
            Couture-precise charts and measurement tips to help you commission the perfect fit.
          </p>
        </motion.div>
      </section>

      <section className="kc-container space-y-8">
        {sizeCharts.map((chart, index) => (
          <motion.div
            key={chart.title}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={index * 0.1}
          >
            <KCCard className="border-white/15 bg-white/10 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl md:p-8">
              <h2 className="mb-6 text-2xl font-serif">{chart.title}</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm text-white/85">
                  <thead>
                    <tr className="border-b border-white/15">
                      <th className="p-3 text-left font-semibold text-white">Measurement</th>
                      {chart.sizes.map((size) => (
                        <th key={size} className="p-3 text-center font-semibold text-white/80">
                          {size}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(chart.measurements).map(([measurement, values], rowIndex) => (
                      <tr
                        key={measurement}
                        className={rowIndex % 2 === 0 ? 'bg-white/6' : ''}
                      >
                        <td className="p-3 font-medium text-white">{measurement}</td>
                        {values.map((value, colIndex) => (
                          <td key={colIndex} className="p-3 text-center text-white/70">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </KCCard>
          </motion.div>
        ))}

        <div className="grid gap-6 md:grid-cols-2">
          {fitTips.map((tip, index) => (
            <motion.div
              key={tip.title}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={(sizeCharts.length + index) * 0.1}
            >
              <KCCard className="border-white/15 bg-white/10 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <Info className="text-[var(--kc-beige)]" size={22} />
                  <h3 className="text-xl font-semibold">{tip.title}</h3>
                </div>
                <ul className="space-y-3 text-white/75">
                  {tip.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--kc-beige)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </KCCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-8 text-center"
        >
          <KCCard className="border-white/15 bg-white/10 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
            <p className="mb-4 text-white/75">
              Still unsure about sizing? Our atelier stylists can guide you through measurements.
            </p>
            <KCButton as="a" href="/contact" variant="secondary" className="px-8">
              Contact our team
            </KCButton>
          </KCCard>
        </motion.div>
      </section>
    </main>
  );
};

export default SizeGuide;

