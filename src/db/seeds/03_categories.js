/**
 * Sample category tree
 */
exports.seed = async function (knex) {
  await knex('categories').del();

  // Root categories
  await knex('categories').insert([
    {
      id: 1,
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      parent_id: null,
      sort_order: 1,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: 'Clothing',
      slug: 'clothing',
      description: 'Apparel and fashion items',
      parent_id: null,
      sort_order: 2,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Products for home and outdoor use',
      parent_id: null,
      sort_order: 3,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 4,
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Sports equipment and outdoor gear',
      parent_id: null,
      sort_order: 4,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // Child categories — Electronics
  await knex('categories').insert([
    {
      id: 10,
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and smartphones',
      parent_id: 1,
      sort_order: 1,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 11,
      name: 'Laptops',
      slug: 'laptops',
      description: 'Portable computers and laptops',
      parent_id: 1,
      sort_order: 2,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 12,
      name: 'Audio',
      slug: 'audio',
      description: 'Headphones, speakers and audio equipment',
      parent_id: 1,
      sort_order: 3,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 13,
      name: 'Tablets',
      slug: 'tablets',
      description: 'Tablet computers and e-readers',
      parent_id: 1,
      sort_order: 4,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // Child categories — Clothing
  await knex('categories').insert([
    {
      id: 20,
      name: "Men's Clothing",
      slug: 'mens-clothing',
      description: 'Clothing and apparel for men',
      parent_id: 2,
      sort_order: 1,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 21,
      name: "Women's Clothing",
      slug: 'womens-clothing',
      description: 'Clothing and apparel for women',
      parent_id: 2,
      sort_order: 2,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 22,
      name: "Kids' Clothing",
      slug: 'kids-clothing',
      description: 'Clothing and apparel for children',
      parent_id: 2,
      sort_order: 3,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // Child categories — Home & Garden
  await knex('categories').insert([
    {
      id: 30,
      name: 'Furniture',
      slug: 'furniture',
      description: 'Indoor and outdoor furniture',
      parent_id: 3,
      sort_order: 1,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 31,
      name: 'Kitchen',
      slug: 'kitchen',
      description: 'Kitchen appliances and cookware',
      parent_id: 3,
      sort_order: 2,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 32,
      name: 'Garden Tools',
      slug: 'garden-tools',
      description: 'Tools and equipment for gardening',
      parent_id: 3,
      sort_order: 3,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // Child categories — Sports & Outdoors
  await knex('categories').insert([
    {
      id: 40,
      name: 'Fitness',
      slug: 'fitness',
      description: 'Fitness and exercise equipment',
      parent_id: 4,
      sort_order: 1,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 41,
      name: 'Camping',
      slug: 'camping',
      description: 'Camping and hiking gear',
      parent_id: 4,
      sort_order: 2,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
