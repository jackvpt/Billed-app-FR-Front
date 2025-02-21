/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import BillsUI from "../views/BillsUI.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js"
import { bills } from "../fixtures/bills.js"
import "@testing-library/jest-dom/extend-expect"
import { checkFileType } from "../containers/NewBill.js"

import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)
jest.spyOn(window, 'alert').mockImplementation(() => {});


/**
 * TEST IF THE WINDOW ICON IS HIGHLIGHTED
 */
describe("Given I am connected as an employee and I am on Bill page", () => {
  it("Should highlight bill icon in vertical layout", async () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    })
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    )

    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)

    router()

    window.onNavigate(ROUTES_PATH.NewBill)

    await waitFor(() => screen.getByTestId("icon-mail"))
    const windowIcon = screen.getByTestId("icon-mail")

    expect(windowIcon).toHaveClass("active-icon")
  })

  /**
   * TEST IF THE FORM IS SUBMITTED
   */
  describe("When I filled all required inputs and add a jpg", () => {
    it("Should open bills page", () => {
      jest.spyOn(mockStore, "bills")

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = NewBillUI({
        data: bills,
      })

      const store = null

      const newBillPage = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      })

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.resolve({
              fileUrl: "https://localhost:3456/images/test.jpg",
              key: "1234",
            })
          },
        }
      })

      jest.spyOn(newBillPage, "onNavigate")
      newBillPage.fileUrl = "https://my-url.com/image.jpg"
      newBillPage.fileName = "image.jpg"
      const fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          querySelector: jest.fn().mockImplementation((selector) => {
            if (selector === `select[data-testid="expense-type"]`) {
              return { value: "Services en ligne" }
            }
            if (selector === `input[data-testid="amount"]`) {
              return { value: 14 }
            }
            if (selector === `input[data-testid="datepicker"]`) {
              return { value: "1989-05-26" }
            }
            if (selector === `input[data-testid="pct"]`) {
              return { value: 20 }
            }
            return { value: undefined }
          }),
        },
      }

      newBillPage.handleSubmit(fakeEvent)
      expect(newBillPage.onNavigate).toHaveBeenCalledWith("#employee/bills")
    })
  })

  /**
   * TEST IF THE FILE IS IN THE RIGHT FORMAT
   */
  describe("When I add a file with the wrong format", () => {
    it("Should return false", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" })
      expect(checkFileType(file)).toBe(false)
    })
  })

  describe("When I add a file with the right format", () => {
    const fileTypes = [
      {
        type: "image/png",
        name: "test.png",
      },
      {
        type: "image/jpg",
        name: "test.jpg",
      },
      {
        type: "image/jpeg",
        name: "test.jpg",
      },
    ]

    fileTypes.forEach((fileType) => {
      it(`Should return true for ${fileType.type}`, () => {
        const file = new File(["test"], fileType.name, { type: fileType.type })
        expect(checkFileType(file)).toBe(true)
      })
    })
  })

  /**
   * TEST POST NEW BILL
   */
  describe("When I post a new bill", () => {
    // New bill creation
    let fakeEvent
    let newBillPage

    beforeEach(() => {
      // Store user as employee in local storage
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      )
      // Create onNavigate function
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      // Create user interface with bills data
      document.body.innerHTML = NewBillUI({
        data: bills,
      })
      // Simulate Bills creation and update
      const store = {
        bills: jest.fn().mockImplementation(() => {
          return {
            create: () => {
              return Promise.resolve({
                fileUrl: "https://localhost:3456/images/test.jpg",
                key: "1234",
              })
            },
            update: () => Promise.resolve(),
          }
        }),
      }
      // Create Bills page
      newBillPage = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      })
      // Set the fileUrl, fileName and fakeEvent
      newBillPage.fileUrl = "https://my-url.com/image.jpg"
      newBillPage.fileName = "image.jpg"
      fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          querySelector: jest.fn().mockImplementation((selector) => {
            if (selector === `select[data-testid="expense-type"]`) {
              return { value: "Services en ligne" }
            }
            if (selector === `select[data-testid="expense-name"]`) {
              return { value: "Vol Paris - New York" }
            }
            if (selector === `input[data-testid="amount"]`) {
              return { value: 14 }
            }
            if (selector === `input[data-testid="datepicker"]`) {
              return { value: "1989-05-26" }
            }
            if (selector === `input[data-testid="pct"]`) {
              return { value: 20 }
            }
            return { value: undefined }
          }),
        },
      }
    })

    it("Should POST a new bill", async () => {
      // Simulate new file
      newBillPage.handleChangeFile(fakeEvent)
      // Submit the form
      newBillPage.handleSubmit(fakeEvent)

      // Wait for the bill has been updated
      await waitFor(() => screen.getByText("Mes notes de frais"))
      // Get the new bill
      const contentPending = screen.getByText("Mes notes de frais")
      // Check if the new bill is displayed
      expect(contentPending).toBeTruthy()
      // Check if the new bill button is displayed
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
    })

    describe("When I submit the form and there's an error with the server", () => {
      it("Should fails with 404 error message", async () => {
        // Simulate 404 error
        mockStore.bills(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            },
          }
        })
        // Set error message
        const html = BillsUI({ error: "Erreur 404" })
        // Set the HTML page
        document.body.innerHTML = html
        // Get the error message
        const message = await screen.getByText(/Erreur 404/)
        // Check if the error message is displayed
        expect(message).toBeTruthy()
      })

      it("Should fails with 500 error message", async () => {
        // Simulate 500 error
        mockStore.bills(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            },
          }
        })
        // Set error message
        const html = BillsUI({ error: "Erreur 500" })
        // Set the HTML page
        document.body.innerHTML = html
        // Get the error message
        const message = await screen.getByText(/Erreur 500/)
        // Check if the error message is displayed
        expect(message).toBeTruthy()
      })
    })

    /**
     * TEST NAVIGATE TO NEW BILL PAGE
     */
    describe("When I navigate to NewBill page", () => {
      let newBillPage
      // Store user as employee in local storage
      beforeEach(() => {
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        )
        // Create onNavigate function
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        // Create user interface with bills data
        document.body.innerHTML = NewBillUI({
          data: bills,
        })
        // Create store
        const store = {
          bills: jest.fn().mockImplementation(() => {
            return {
              list: () => {
                return Promise.resolve(bills)
              },
            }
          }),
        }
        // Create Bills page
        newBillPage = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        })
      })

      it("Should display the new bill page", async () => {
        // Get New Bills
        const html = NewBillUI()
        // Set the HTML page
        document.body.innerHTML = html
        // Get New Bill form
        const newBillForm = screen.getByTestId("form-new-bill")
        // Check if the form is displayed
        expect(newBillForm).toBeTruthy()
      })
    })
  })

  // TEST GET DATA
  describe("When I navigate to Bills", () => {
    it("Should fetch bills from mock API GET", async () => {
      // Store user as employee in local storage
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      )
      // Create root element
      const root = document.createElement("div")
      // Set root element id
      root.setAttribute("id", "root")
      // Append root element to body
      document.body.append(root)
      // Call router function
      router()
      // Navigate to Bills page
      window.onNavigate(ROUTES_PATH.Bills)
      // Wait for the page to be loaded
      await waitFor(() => screen.getByText("Mes notes de frais"))

      const tableFields = ["Type", "Nom", "Montant", "Statut", "Actions"]
      tableFields.forEach((field) => {
        expect(screen.getByText(field)).toBeTruthy()
      })
    })

    /**
     * TEST API ERROR
     */
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        })
        // Store user as employee in local storage
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        )
        // Create root element
        const root = document.createElement("div")
        // Set root element id
        root.setAttribute("id", "root")
        // Append root element to body
        document.body.appendChild(root)
        // Call router function
        router()
      })

      it("Should fetch bills from an API and fails with 404 message error", async () => {
        // Simulate 404 error
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            },
          }
        })
        // Create onNavigate function
        window.onNavigate(ROUTES_PATH.Bills)
        // Wait for the Promise
        await new Promise(process.nextTick)
        // Get the error message
        const message = await screen.getByText(/Erreur 404/)
        // Check if the error message is displayed
        expect(message).toBeTruthy()
      })

      it("Should fetch messages from an API and fails with 500 message error", async () => {
        // Simulate 500 error
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            },
          }
        })
        // Create onNavigate function
        window.onNavigate(ROUTES_PATH.Bills)
        // Wait for the Promise
        await new Promise(process.nextTick)
        // Get the error message
        const message = await screen.getByText(/Erreur 500/)
        // Check if the error message is displayed
        expect(message).toBeTruthy()
      })
    })
  })

  /**
   * TEST HandleChangeFile
   */
  describe("When I select a new file", () => {
    let instance, store, localStorageMock, onNavigate
    beforeEach(() => {
      // Create input file in the DOM
      document.body.innerHTML =
        '<form data-testid="form-new-bill"><input type="file" data-testid="file" />       </form>    '
      // Create onNavigate function
      onNavigate = jest.fn()
      // Fake store creation with bills() method returning an object
      store = {
        bills: jest.fn(() => ({
          create: jest.fn(() =>
            Promise.resolve({
              fileUrl: "urlTest",
              key: "billID",
            })
          ),
        })),
      }
      // LocalStorage simulation
      localStorageMock = {
        getItem: jest.fn(() =>
          JSON.stringify({ email: "test@test.com (mailto:test@test.com)" })
        ),
        setItem: jest.fn(),
      }
      // NewBill instance creation with fake document, onNavigate, store and localStorage
      instance = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: localStorageMock,
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("Should not upload file if type is unvalid", () => {
      // Replace alert method to check if it is called
      window.alert = jest.fn()

      // DOM input file retrieval
      const inputFile = document.querySelector(`input[data-testid="file"]`)
      // Unvalid file type creation
      const invalidFile = new File(["test"], "test.txt", {
        type: "text/plain",
      })
      // Set input files property
      Object.defineProperty(inputFile, "files", {
        value: [invalidFile],
        writable: true,
      })

      // Fake event creation with target.value and target.files
      const e = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.txt",
          files: [invalidFile],
        },
      }

      // Method execution
      instance.handleChangeFile(e)
      // Check that e.preventDefault has been called
      expect(e.preventDefault).toHaveBeenCalled()
      // Check that alert has been called with the right message
      expect(window.alert).toHaveBeenCalledWith(
        "Type de fichier non pris en charge"
      )
      expect(store.bills).not.toHaveBeenCalled()
      // No change should be made on instance properties
      expect(instance.fileUrl).toBeNull()
      expect(instance.billId).toBeNull()
    })

    it("Should upload the file if the type is valid", (done) => {
      // Input file retrieval
      const inputFile = document.querySelector('input[data-testid="file"]')
      // Valid file creation (image/png)
      const validFile = new File(["test"], "test.png", {
        type: "image/png",
      })
      Object.defineProperty(inputFile, "files", {
        value: [validFile],
        writable: true,
      })

      // Event simulation with a value representing the simulated path
      const e = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.png",
          files: [validFile],
        },
      }

      // Method execution
      instance.handleChangeFile(e)

      // Method calls are made in the next tick, so we have to wait for it to be resolved
      process.nextTick(() => {
        // Check that bills() method has been called
        expect(store.bills).toHaveBeenCalled()
        // Retrieve the instance of the object returned by store.bills()
        const billsInstance = store.bills.mock.results[0].value
        expect(billsInstance.create).toHaveBeenCalled()

        // Check that instance properties have been updated
        expect(instance.billId).toBe("billID")
        expect(instance.fileUrl).toBeDefined()
        expect(instance.fileName).toBe("test.png")
        done()
      })
    })
  })
})
