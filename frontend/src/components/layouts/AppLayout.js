import React, { useContext, Fragment } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import AuthContext from '../../context/AuthContext';
import NotificationDropdown from '../common/NotificationDropdown';
import logo from '../../assets/logo.png';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Shared shell for every portal.
 *
 * portal = {
 *   key: 'client',              // used for the profile link: /<key>/profile
 *   title: 'Client Portal',     // fallback page title
 *   items: [{ name, href, match?(pathname) }],   // main menu
 *   more:  [{ name, href, match?(pathname) }],   // grouped under a "More" menu
 *   extras: <ReactNode/>,       // optional (e.g. the chatbot)
 * }
 */
const AppLayout = ({ portal }) => {
  const { user, logout } = useContext(AuthContext);
  const { pathname } = useLocation();

  const withCurrent = (list = []) =>
    list.map((item) => ({
      ...item,
      current: item.match ? item.match(pathname) : pathname.startsWith(item.href),
    }));

  const items = withCurrent(portal.items);
  const more = withCurrent(portal.more);
  const allItems = [...items, ...more];
  const moreIsCurrent = more.some((i) => i.current);
  const initial = user?.name?.charAt(0).toUpperCase() || 'U';
  const profileHref = `/${portal.key}/profile`;

  return (
    <div className="min-h-screen bg-gray-100">
      <Disclosure as="nav" className="bg-primary-900 shadow-lg">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-full px-4 sm:px-8 lg:px-12">
              <div className="flex h-20 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img src={logo} alt="UniDots" className="h-20 w-auto" />
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-12 flex items-center space-x-4 lg:space-x-6">
                      {items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-primary-800 text-white border-b-2 border-secondary-400'
                              : 'text-slate-200 hover:bg-primary-800 hover:text-white',
                            'rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200'
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          {item.name}
                        </Link>
                      ))}

                      {more.length > 0 && (
                        <Menu as="div" className="relative">
                          <Menu.Button
                            className={classNames(
                              moreIsCurrent
                                ? 'bg-primary-800 text-white border-b-2 border-secondary-400'
                                : 'text-slate-200 hover:bg-primary-800 hover:text-white',
                              'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white'
                            )}
                          >
                            More
                            <ChevronDownIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                          </Menu.Button>
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute left-0 z-20 mt-2 w-56 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              {more.map((item) => (
                                <Menu.Item key={item.href}>
                                  {({ active }) => (
                                    <Link
                                      to={item.href}
                                      className={classNames(
                                        active ? 'bg-gray-100' : '',
                                        item.current ? 'font-semibold text-primary-700' : 'text-gray-700',
                                        'block px-4 py-2 text-sm'
                                      )}
                                    >
                                      {item.name}
                                    </Link>
                                  )}
                                </Menu.Item>
                              ))}
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    <NotificationDropdown colorClasses="bg-primary-800 text-slate-200 hover:bg-primary-700" />

                    <Menu as="div" className="relative ml-3">
                      <Menu.Button className="flex max-w-xs items-center rounded-full bg-primary-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-900">
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">{initial}</span>
                        </div>
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to={profileHref}
                                className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                              >
                                Your Profile
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={logout}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block w-full text-left px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>

                <div className="flex items-center md:hidden space-x-2">
                  <NotificationDropdown colorClasses="bg-primary-800 text-slate-200 hover:bg-primary-700" />
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-primary-800 p-2 text-slate-200 hover:bg-primary-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-900">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                {items.map((item) => (
                  <Disclosure.Button
                    key={item.href}
                    as={Link}
                    to={item.href}
                    className={classNames(
                      item.current ? 'bg-primary-800 text-white' : 'text-slate-200 hover:bg-primary-800 hover:text-white',
                      'block rounded-md px-3 py-3 text-base font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}

                {more.length > 0 && (
                  <>
                    <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-secondary-300">More</p>
                    {more.map((item) => (
                      <Disclosure.Button
                        key={item.href}
                        as={Link}
                        to={item.href}
                        className={classNames(
                          item.current ? 'bg-primary-800 text-white' : 'text-slate-200 hover:bg-primary-800 hover:text-white',
                          'block rounded-md px-3 py-3 text-base font-medium'
                        )}
                        aria-current={item.current ? 'page' : undefined}
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                  </>
                )}
              </div>
              <div className="border-t border-primary-800 pb-3 pt-4">
                <div className="flex items-center px-5">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{initial}</span>
                  </div>
                  <div className="ml-3 min-w-0">
                    <div className="truncate text-base font-medium text-white">{user?.name}</div>
                    <div className="truncate text-sm font-medium text-slate-300">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <Disclosure.Button
                    as={Link}
                    to={profileHref}
                    className="block rounded-md px-3 py-3 text-base font-medium text-slate-200 hover:bg-primary-800 hover:text-white"
                  >
                    Your Profile
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="button"
                    onClick={logout}
                    className="block w-full text-left rounded-md px-3 py-3 text-base font-medium text-slate-200 hover:bg-primary-800 hover:text-white"
                  >
                    Sign out
                  </Disclosure.Button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {allItems.find((item) => item.current)?.name || portal.title}
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {portal.extras}
    </div>
  );
};

export default AppLayout;
