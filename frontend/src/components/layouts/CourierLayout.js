import React, { useContext, Fragment } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import AuthContext from '../../context/AuthContext';
import NotificationDropdown from '../common/NotificationDropdown';
import logo from '../../assets/logo.png';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const CourierLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/courier', current: location.pathname === '/courier' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Disclosure as="nav" className="bg-slate-800 shadow-lg">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-full px-6 sm:px-8 lg:px-12">
              <div className="flex h-20 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img src={logo} alt="UNI Logo" className="h-20 w-auto" />
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-12 flex items-baseline space-x-6">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-slate-700 text-white border-b-2 border-green-400'
                              : 'text-slate-200 hover:bg-slate-700 hover:text-white',
                            'rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200'
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    <NotificationDropdown colorClasses="bg-slate-700 text-slate-200 hover:bg-slate-600" />
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex max-w-xs items-center rounded-full bg-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-800">
                          <span className="sr-only">Open user menu</span>
                          <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                          </div>
                        </Menu.Button>
                      </div>
                      <Transition as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/courier/profile"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Your Profile
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
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
                  {/* Mobile notification center - positioned next to hamburger menu */}
                  <NotificationDropdown colorClasses="bg-slate-700 text-slate-200 hover:bg-slate-600" />
                  
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-slate-700 p-2 text-slate-200 hover:bg-slate-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-800">
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
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={classNames(
                      item.current
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-200 hover:bg-slate-700 hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              <div className="border-t border-slate-700 pb-3 pt-4">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user?.name}</div>
                    <div className="text-sm font-medium text-slate-300">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <Disclosure.Button as={Link} to="/courier/profile" className="block rounded-md px-3 py-2 text-base font-medium text-slate-200 hover:bg-slate-700 hover:text-white">
                    Your Profile
                  </Disclosure.Button>
                  <Disclosure.Button as="button" onClick={logout} className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-slate-200 hover:bg-slate-700 hover:text-white">
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{navigation.find((item) => item.current)?.name || 'Courier Portal'}</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CourierLayout;


