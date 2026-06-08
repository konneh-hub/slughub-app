const courseRegistrations = require('../src/routes/courseRegistrations');

describe('Course registrations router', () => {
  it('exports a dedicated router with expected registration routes', () => {
    const routes = courseRegistrations.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).sort(),
      }));

    expect(routes).toEqual(
      expect.arrayContaining([
        { path: '/course/:id', methods: ['get'] },
        { path: '/student/:id', methods: ['get'] },
        { path: '/student/:id', methods: ['post'] },
        { path: '/student/:id/:registrationId', methods: ['delete'] }
      ])
    );
  });
});
