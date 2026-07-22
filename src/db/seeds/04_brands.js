/**
 * Sample brands
 */
exports.seed = async function (knex) {
  await knex('brands').del();

  await knex('brands').insert([
    {
      id: 1,
      name: 'TechCore',
      slug: 'techcore',
      description: 'Leading manufacturer of consumer electronics',
      website_url: 'https://techcore.example.com',
      logo_url: null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: 'UrbanWear',
      slug: 'urbanwear',
      description: 'Contemporary urban fashion brand',
      website_url: 'https://urbanwear.example.com',
      logo_url: null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      name: 'HomeEssentials',
      slug: 'home-essentials',
      description: 'Quality products for every home',
      website_url: 'https://homeessentials.example.com',
      logo_url: null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 4,
      name: 'ActivePeak',
      slug: 'activepeak',
      description: 'Performance gear for athletes and outdoor enthusiasts',
      website_url: 'https://activepeak.example.com',
      logo_url: null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 5,
      name: 'SoundWave',
      slug: 'soundwave',
      description: 'Premium audio equipment and accessories',
      website_url: 'https://soundwave.example.com',
      logo_url: null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 6,
      name: 'NovaMobile',
      slug: 'novamobile',
      description: 'Innovative mobile devices and accessories',
      website_url: 'https://novamobile.example.com',
      logo_url: null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
